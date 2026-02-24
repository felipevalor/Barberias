import { Router } from 'express';
import { staffController } from '../controllers/staff.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de staff requieren estar autenticado y ser ADMIN (dueño)
router.use(verifyToken, requireRole(['ADMIN']));

router.post('/', staffController.createBarbero.bind(staffController));
router.get('/', staffController.getBarberos.bind(staffController));
router.get('/:id', staffController.getBarbero.bind(staffController));
router.post('/:id/horarios', staffController.setHorarios.bind(staffController));
router.post('/:id/ausencias', staffController.setAusencia.bind(staffController));
router.patch('/:id', staffController.updateBarbero.bind(staffController));
router.delete('/:id', staffController.deleteBarbero.bind(staffController));

export default router;
