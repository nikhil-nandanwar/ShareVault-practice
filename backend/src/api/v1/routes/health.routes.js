import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';

const router = Router();

router.get('/healthz', healthController.liveness);
router.get('/readyz', asyncHandler(healthController.readiness));

export default router;
