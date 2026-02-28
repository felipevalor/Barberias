import { Router } from 'express';
import { clienteController } from '../controllers/cliente.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas del Directorio de Clientes y CRM requieren estar al menos logueadas con rol de local
router.use(verifyToken);

router.get('/', clienteController.getClientes.bind(clienteController));
router.get('/:id', clienteController.getClienteDetalle.bind(clienteController));
router.put('/:id', clienteController.updateCliente.bind(clienteController));
router.delete('/:id', clienteController.deleteCliente.bind(clienteController));

export default router;
