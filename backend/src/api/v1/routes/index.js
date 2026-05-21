import { Router } from 'express';
import uploadRoutes from './upload.routes.js';
import contentRoutes from './content.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/upload', uploadRoutes);
router.use('/', contentRoutes);
router.use('/admin', adminRoutes);

router.get('/hello', (_req, res) => {
    res.json({ success: true, data: { message: 'Hello, World!' } });
});

export default router;
