import { randomUUID } from 'node:crypto';
import { getStorage } from './storage/index.js';
import { contentService } from './content.service.js';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Chunked upload session registry.
 *
 * Sessions live in process memory — fine for a single-instance deployment.
 * If we scale horizontally we'd need to externalize this (Redis, Mongo TTL
 * collection) and route chunks via sessionId-affinity. The on-disk chunk
 * artifacts are local to whichever node received them, so today's design
 * assumes one node owns a session for its lifetime.
 */
const sessions = new Map();

// Periodically drop sessions whose creator hasn't touched them in a while
// and remove their chunk debris. The interval is shorter than the TTL so a
// session never lingers more than ttl + interval.
const SWEEP_INTERVAL_MS = Math.max(60_000, Math.floor(config.upload.chunkSessionTtlMs / 4));
setInterval(() => {
    const now = Date.now();
    const storage = getStorage();
    for (const [id, s] of sessions) {
        if (now - s.lastActive > config.upload.chunkSessionTtlMs) {
            sessions.delete(id);
            storage.cleanupSession(id).catch((err) => {
                logger.error({ err, sessionId: id }, 'Failed to cleanup expired chunk session');
            });
        }
    }
}, SWEEP_INTERVAL_MS).unref();

function requireFile(sessionId, fileId) {
    const session = sessions.get(sessionId);
    if (!session) throw ApiError.notFound('Upload session not found or expired');
    session.lastActive = Date.now();
    const file = session.files.get(fileId);
    if (!file) throw ApiError.notFound('File not registered in session');
    return { session, file };
}

function sanitizeRelativePath(raw, originalName) {
    if (typeof raw !== 'string' || !raw) return '';
    const normalized = raw.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalized || normalized.length > 1024) return '';
    const parts = normalized.split('/').filter((s) => s && s !== '.' && s !== '..');
    if (!parts.length) return '';
    if (originalName && parts[parts.length - 1] !== originalName) return '';
    return parts.join('/');
}

export const chunkSessionService = {
    create(filesInput) {
        if (!Array.isArray(filesInput) || filesInput.length === 0) {
            throw ApiError.badRequest('No files in session');
        }
        if (filesInput.length > config.upload.maxFiles) {
            throw ApiError.badRequest(`At most ${config.upload.maxFiles} files per upload`);
        }

        const sessionId = randomUUID();
        const files = new Map();
        const responseFiles = [];

        const chunkSize = config.upload.maxChunkSizeBytes;

        for (const f of filesInput) {
            if (typeof f.name !== 'string' || !f.name || f.name.length > 512) {
                throw ApiError.badRequest('Invalid file name');
            }
            if (!Number.isInteger(f.size) || f.size < 0 || f.size > config.upload.maxFileSizeBytes) {
                throw ApiError.badRequest(`File "${f.name}" exceeds the size limit`);
            }
            // Allow a small slack factor so a client using a slightly different
            // chunk size still passes (rounding differences). Anything more
            // than 2× our chunk cap is treated as misconfiguration.
            const expectedMinChunks = Math.max(1, Math.ceil(f.size / (chunkSize * 2)));
            const expectedMaxChunks = Math.max(1, Math.ceil(f.size / 1));
            if (
                !Number.isInteger(f.totalChunks)
                || f.totalChunks < expectedMinChunks
                || f.totalChunks > expectedMaxChunks
                || f.totalChunks > 100_000
            ) {
                throw ApiError.badRequest(`File "${f.name}" has invalid chunk count`);
            }

            const fileId = randomUUID();
            files.set(fileId, {
                fileId,
                name: f.name,
                relativePath: sanitizeRelativePath(f.relativePath, f.name),
                size: f.size,
                totalChunks: f.totalChunks,
                mimeType: typeof f.mimeType === 'string' && f.mimeType
                    ? f.mimeType.slice(0, 255)
                    : 'application/octet-stream',
                receivedChunks: new Set(),
                receivedBytes: 0,
            });
            responseFiles.push({ fileId, name: f.name });
        }

        const now = Date.now();
        sessions.set(sessionId, {
            id: sessionId,
            createdAt: now,
            lastActive: now,
            files,
        });

        return {
            sessionId,
            files: responseFiles,
            chunkSize,
        };
    },

    async receiveChunk(sessionId, fileId, chunkIndex, reqStream) {
        const { file } = requireFile(sessionId, fileId);
        if (chunkIndex < 0 || chunkIndex >= file.totalChunks) {
            throw ApiError.badRequest('Invalid chunk index');
        }
        if (file.receivedChunks.has(chunkIndex)) {
            // Idempotent retry — drain the request body and acknowledge.
            reqStream.resume();
            return {
                received: chunkIndex,
                duplicate: true,
                totalReceived: file.receivedChunks.size,
                totalChunks: file.totalChunks,
            };
        }

        const storage = getStorage();
        const ws = storage.createChunkStream(sessionId, fileId, chunkIndex);
        const maxChunkSize = config.upload.maxChunkSizeBytes;

        let bytes = 0;
        let aborted = false;

        await new Promise((resolve, reject) => {
            const fail = (err) => {
                if (aborted) return;
                aborted = true;
                reqStream.unpipe(ws);
                ws.destroy();
                reqStream.resume(); // drain any remaining bytes so the client gets a response
                reject(err);
            };

            reqStream.on('data', (buf) => {
                bytes += buf.length;
                if (bytes > maxChunkSize) {
                    fail(ApiError.payloadTooLarge('Chunk exceeds maximum size'));
                }
            });
            reqStream.on('error', fail);
            ws.on('error', fail);
            ws.on('finish', () => {
                if (!aborted) resolve();
            });

            reqStream.pipe(ws);
        });

        file.receivedChunks.add(chunkIndex);
        file.receivedBytes += bytes;
        return {
            received: chunkIndex,
            duplicate: false,
            totalReceived: file.receivedChunks.size,
            totalChunks: file.totalChunks,
        };
    },

    async finalize(sessionId) {
        const session = sessions.get(sessionId);
        if (!session) throw ApiError.notFound('Upload session not found or expired');

        for (const file of session.files.values()) {
            if (file.receivedChunks.size !== file.totalChunks) {
                throw ApiError.badRequest(
                    `File "${file.name}" is incomplete (${file.receivedChunks.size}/${file.totalChunks} chunks)`,
                );
            }
        }

        const storage = getStorage();
        const assembledFiles = [];

        try {
            for (const file of session.files.values()) {
                const { key, size } = await storage.assembleChunks(
                    sessionId,
                    file.fileId,
                    file.name,
                    file.totalChunks,
                );
                if (file.size && size !== file.size) {
                    // Reassembled size doesn't match the size the client declared.
                    // Treat as corruption rather than silently shipping bad data.
                    throw ApiError.badRequest(
                        `File "${file.name}" failed integrity check (expected ${file.size}, got ${size})`,
                    );
                }
                assembledFiles.push({
                    storageKey: key,
                    originalName: file.name,
                    relativePath: file.relativePath,
                    size,
                    mimeType: file.mimeType,
                });
            }

            const result = await contentService.createFiles({ files: assembledFiles });

            sessions.delete(sessionId);
            storage.cleanupSession(sessionId).catch((err) => {
                logger.error({ err, sessionId }, 'Failed to cleanup chunk session after finalize');
            });

            return result;
        } catch (err) {
            // Roll back assembled-but-not-recorded files so we don't leak storage.
            await Promise.allSettled(assembledFiles.map((f) => storage.delete(f.storageKey)));
            throw err;
        }
    },

    async abort(sessionId) {
        const storage = getStorage();
        sessions.delete(sessionId);
        await storage.cleanupSession(sessionId);
    },
};

export default chunkSessionService;
