import { Router } from 'express';
import { posController } from '../controllers/pos.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Todas las operaciones de caja requieren token
router.use(verifyToken);

// Métodos de Pago
router.get('/metodos', posController.getMetodos.bind(posController));
router.post('/metodos', requireRole(['ADMIN']), posController.createMetodo.bind(posController));

// Transacciones y Flujo
router.post('/checkout/:turnoId', requireRole(['ADMIN', 'BARBERO']), posController.checkout.bind(posController));
router.post('/gasto', requireRole(['ADMIN']), posController.registrarGasto.bind(posController));
router.get('/flujo', requireRole(['ADMIN']), posController.getCajaDiaria.bind(posController));

export default router;
