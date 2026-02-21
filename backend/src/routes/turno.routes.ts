import { Router } from 'express';
import { turnoController } from '../controllers/turno.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de agenda requieren autenticación
router.use(verifyToken);

// Bloqueos debe ir antes de /:id para evitar conflicto de rutas
router.get('/bloqueos', turnoController.getBloqueos.bind(turnoController));

router.post('/', turnoController.crearTurno.bind(turnoController));
router.get('/', turnoController.getTurnos.bind(turnoController));
router.put('/:id', turnoController.updateTurno.bind(turnoController));
router.patch('/:id/estado', turnoController.cambiarEstado.bind(turnoController));

export default router;
