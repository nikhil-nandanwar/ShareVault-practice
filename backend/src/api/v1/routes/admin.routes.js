import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { adminAuth } from '../../../middlewares/adminAuth.middleware.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';

const router = Router();

router.use(adminAuth);

router.delete('/purge-all', asyncHandler(adminController.purgeAll));

export default router;
