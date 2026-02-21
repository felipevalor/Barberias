import { Router } from 'express';
import { productoController } from '../controllers/producto.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de inventario requieren autenticación
router.use(verifyToken);

router.get('/', productoController.getAll.bind(productoController));

// Crear, modificar, eliminar requiere ser ADMIN o SUPERADMIN
router.post('/', requireRole(['ADMIN', 'SUPERADMIN']), productoController.create.bind(productoController));
router.put('/:id', requireRole(['ADMIN', 'SUPERADMIN']), productoController.update.bind(productoController));
router.delete('/:id', requireRole(['ADMIN', 'SUPERADMIN']), productoController.remove.bind(productoController));

// Vender un producto directo por caja
router.post('/:id/vender', requireRole(['ADMIN', 'BARBERO']), productoController.vender.bind(productoController));

export default router;
