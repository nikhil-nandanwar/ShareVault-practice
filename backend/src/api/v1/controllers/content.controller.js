import { contentService } from '../../../services/content.service.js';
import { ok } from '../../../utils/ApiResponse.js';
import { logger } from '../../../config/logger.js';

export const contentController = {
    async getByCode(req, res) {
        const data = await contentService.getByCode(req.params.code);
        return ok(res, data);
    },

    async download(req, res) {
        const { file, stat, storage } = await contentService.resolveFile(
            req.params.code,
            req.params.fileIndex,
        );

        const encodedName = encodeURIComponent(file.filename);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
        );
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Cache-Control', 'private, no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        if (file.relativePath) {
            res.setHeader('X-Relative-Path', encodeURIComponent(file.relativePath));
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Relative-Path');
        }

        const stream = storage.createReadStream(file.storageKey);

        stream.on('error', (err) => {
            logger.error({ err, code: req.params.code }, 'Download stream error');
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: { message: 'Error reading file' } });
            } else {
                res.destroy(err);
            }
        });

        req.on('close', () => stream.destroy());
        stream.pipe(res);
    },
};

export default contentController;
