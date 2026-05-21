import { contentService } from '../../../services/content.service.js';
import { ok } from '../../../utils/ApiResponse.js';

export const adminController = {
    async purgeAll(_req, res) {
        const result = await contentService.purgeAll();
        return ok(res, {
            message: 'Purged all content',
            deletedCount: result.deletedCount,
        });
    },
};

export default adminController;
