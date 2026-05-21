import { Router } from 'express';
import { contentController } from '../controllers/content.controller.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { codeParam, downloadParams } from '../validators/content.validator.js';

const router = Router();

router.get(
    '/content/:code',
    validate({ params: codeParam }),
    asyncHandler(contentController.getByCode),
);

router.get(
    '/download/:code/:fileIndex',
    validate({ params: downloadParams }),
    asyncHandler(contentController.download),
);

export default router;
