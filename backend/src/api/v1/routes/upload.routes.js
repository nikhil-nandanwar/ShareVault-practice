import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { upload } from '../../../middlewares/upload.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { uploadRateLimiter } from '../../../middlewares/rateLimit.middleware.js';
import { textUploadBody } from '../validators/content.validator.js';

const router = Router();

router.post(
    '/text',
    uploadRateLimiter,
    validate({ body: textUploadBody }),
    asyncHandler(uploadController.uploadText),
);

router.post(
    '/file',
    uploadRateLimiter,
    upload.array('files'),
    asyncHandler(uploadController.uploadFiles),
);

export default router;
