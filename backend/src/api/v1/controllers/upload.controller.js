import { contentService } from '../../../services/content.service.js';
import { created } from '../../../utils/ApiResponse.js';
import { ApiError } from '../../../utils/ApiError.js';

export const uploadController = {
    async uploadText(req, res) {
        const { content } = req.body;
        const result = await contentService.createText({ content });
        return created(res, result);
    },

    async uploadFiles(req, res) {
        if (!req.files?.length) throw ApiError.badRequest('No files uploaded');
        const files = req.files.map((f) => ({
            storageKey: f.storageKey,
            originalName: f.originalname,
            size: f.size,
            mimeType: f.mimetype,
        }));
        const result = await contentService.createFiles({ files });
        return created(res, result);
    },
};

export default uploadController;
