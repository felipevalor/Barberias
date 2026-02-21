import { Router } from 'express';
import { servicioController } from '../controllers/servicio.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación. Solo admin maneja catálogos completos (por ahora)
router.use(verifyToken);

router.post('/', requireRole(['ADMIN']), servicioController.createServicio.bind(servicioController));
router.get('/', servicioController.getServicios.bind(servicioController)); // Todo equipo puede ver los servicios
router.patch('/:id/estado', requireRole(['ADMIN']), servicioController.updateEstado.bind(servicioController));
router.put('/:id', requireRole(['ADMIN']), servicioController.updateServicio.bind(servicioController));

export default router;
