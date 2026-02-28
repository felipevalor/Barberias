import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);
router.use(requireRole(['ADMIN', 'SUPERADMIN']));

router.get('/', dashboardController.getDashboard.bind(dashboardController));

export default router;
