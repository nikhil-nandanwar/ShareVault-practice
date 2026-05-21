import { contentService } from '../../../services/content.service.js';
import { chunkSessionService } from '../../../services/chunkSession.service.js';
import { created, ok } from '../../../utils/ApiResponse.js';
import { ApiError } from '../../../utils/ApiError.js';

export const uploadController = {
    async uploadText(req, res) {
        const { content } = req.body;
        const result = await contentService.createText({ content });
        return created(res, result);
    },

    async uploadFiles(req, res) {
        if (!req.files?.length) throw ApiError.badRequest('No files uploaded');

        // `paths` is a parallel array (one entry per file in the same order)
        // populated when the client uploads a folder via webkitdirectory.
        // Multer surfaces it as a string for single value, array for many.
        const rawPaths = req.body?.paths;
        const paths = Array.isArray(rawPaths) ? rawPaths : rawPaths ? [rawPaths] : [];

        const files = req.files.map((f, i) => ({
            storageKey: f.storageKey,
            originalName: f.originalname,
            relativePath: sanitizeRelativePath(paths[i], f.originalname),
            size: f.size,
            mimeType: f.mimetype,
        }));
        const result = await contentService.createFiles({ files });
        return created(res, result);
    },

    async initChunkSession(req, res) {
        const result = chunkSessionService.create(req.body.files);
        return created(res, result);
    },

    async uploadChunk(req, res) {
        const { sessionId, fileId } = req.params;
        const chunkIndex = Number.parseInt(req.params.chunkIndex, 10);
        if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
            throw ApiError.badRequest('Invalid chunk index');
        }
        const result = await chunkSessionService.receiveChunk(sessionId, fileId, chunkIndex, req);
        return ok(res, result);
    },

    async finalizeChunkSession(req, res) {
        const result = await chunkSessionService.finalize(req.params.sessionId);
        return created(res, result);
    },

    async abortChunkSession(req, res) {
        await chunkSessionService.abort(req.params.sessionId);
        return ok(res, { aborted: true });
    },
};

// Normalize a client-supplied relative path: posix separators, no leading slash,
// no traversal segments, no absolute Windows paths, capped length. Falls back
// to the file's own basename when the input is missing or unsafe.
function sanitizeRelativePath(raw, originalName) {
    if (typeof raw !== 'string' || !raw) return '';
    let p = raw.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!p || p.length > 1024) return '';
    const parts = p.split('/').filter((s) => s && s !== '.' && s !== '..');
    if (!parts.length) return '';
    // If the last segment doesn't match the file's own name, drop the path
    // entirely — the pairing is suspect and we'd rather lose the folder
    // structure than mis-attribute it.
    if (originalName && parts[parts.length - 1] !== originalName) return '';
    return parts.join('/');
}

export default uploadController;
