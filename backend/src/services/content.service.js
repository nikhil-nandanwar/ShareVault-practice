import { contentRepository } from '../repositories/content.repository.js';
import { generateUniqueCode } from './code.service.js';
import { getStorage } from './storage/index.js';
import { ApiError } from '../utils/ApiError.js';
import { CONTENT_TYPES } from '../utils/constants.js';
import { logger } from '../config/logger.js';

export const contentService = {
    async createText({ content }) {
        const code = await generateUniqueCode();
        const doc = await contentRepository.create({
            code,
            type: CONTENT_TYPES.TEXT,
            content,
        });
        return { code, createdAt: doc.createdAt };
    },

    async createFiles({ files }) {
        if (!files?.length) throw ApiError.badRequest('No files uploaded');

        const code = await generateUniqueCode();
        const fileMetas = files.map((f) => ({
            storageKey: f.storageKey,
            filename: f.originalName,
            size: f.size,
            mimeType: f.mimeType,
        }));

        try {
            const doc = await contentRepository.create({
                code,
                type: CONTENT_TYPES.FILE,
                files: fileMetas,
            });
            return { code, fileCount: fileMetas.length, createdAt: doc.createdAt };
        } catch (err) {
            // DB failed after files landed on disk — clean them up to avoid orphans.
            const storage = getStorage();
            await Promise.allSettled(files.map((f) => storage.delete(f.storageKey)));
            throw err;
        }
    },

    async getByCode(code) {
        const doc = await contentRepository.findByCode(code);
        if (!doc) throw ApiError.notFound('Content not found or expired');
        return serialize(doc);
    },

    async resolveFile(code, fileIndex) {
        const doc = await contentRepository.findByCode(code);
        if (!doc) throw ApiError.notFound('Content not found or expired');
        if (doc.type !== CONTENT_TYPES.FILE) {
            throw ApiError.badRequest('Content is not a file');
        }
        const idx = Number.parseInt(fileIndex, 10);
        if (!Number.isInteger(idx) || idx < 0 || idx >= (doc.files?.length ?? 0)) {
            throw ApiError.notFound('File not found');
        }

        const file = doc.files[idx];
        const storage = getStorage();
        const stat = await storage.stat(file.storageKey);
        if (!stat) throw ApiError.notFound('File no longer available');

        return { file, stat, storage };
    },

    async purgeAll() {
        const storage = getStorage();
        const [{ deletedCount = 0 } = {}] = await Promise.all([
            contentRepository.deleteAll(),
            storage.clear().catch((err) => {
                logger.error({ err }, 'Storage clear failed during purgeAll');
            }),
        ]);
        return { deletedCount };
    },

};

function serialize(doc) {
    const base = {
        code: doc.code,
        type: doc.type,
        createdAt: doc.createdAt,
    };
    if (doc.type === CONTENT_TYPES.TEXT) {
        return { ...base, content: doc.content };
    }
    return {
        ...base,
        files: (doc.files || []).map((f, index) => ({
            index,
            filename: f.filename,
            size: f.size,
            mimeType: f.mimeType,
        })),
    };
}

export default contentService;
