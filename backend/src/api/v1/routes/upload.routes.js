import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { upload } from '../../../middlewares/upload.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { uploadRateLimiter } from '../../../middlewares/rateLimit.middleware.js';
import {
    chunkParams,
    initChunkSessionBody,
    sessionParams,
    textUploadBody,
} from '../validators/content.validator.js';

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

// Chunked upload: client calls /init to register the file list, streams each
// chunk to /chunk/:sessionId/:fileId/:chunkIndex as application/octet-stream,
// then calls /finalize/:sessionId to reassemble and create the content record.
router.post(
    '/init',
    uploadRateLimiter,
    validate({ body: initChunkSessionBody }),
    asyncHandler(uploadController.initChunkSession),
);

router.post(
    '/chunk/:sessionId/:fileId/:chunkIndex',
    validate({ params: chunkParams }),
    asyncHandler(uploadController.uploadChunk),
);

router.post(
    '/finalize/:sessionId',
    uploadRateLimiter,
    validate({ params: sessionParams }),
    asyncHandler(uploadController.finalizeChunkSession),
);

router.delete(
    '/session/:sessionId',
    validate({ params: sessionParams }),
    asyncHandler(uploadController.abortChunkSession),
);

export default router;
