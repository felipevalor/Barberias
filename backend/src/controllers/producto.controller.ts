import { Response } from 'express';
import { productoService } from '../services/producto.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ProductoController {
    async getAll(req: AuthRequest, res: Response) {
        try {
            const q = req.query.q as string;
            const productos = await productoService.getProductos(req.user!.barberiaId!, q);
            res.status(200).json(productos);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async create(req: AuthRequest, res: Response) {
        try {
            const data = req.body;
            const producto = await productoService.createProducto(req.user!.barberiaId!, data);
            res.status(201).json(producto);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async update(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id as string;
            const data = req.body;
            const producto = await productoService.updateProducto(id, req.user!.barberiaId!, data);
            res.status(200).json(producto);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async remove(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id as string;
            await productoService.deleteProducto(id, req.user!.barberiaId!);
            res.status(200).json({ message: 'Producto eliminado correctamente' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async vender(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id as string;
            const { cantidad, metodoPagoId } = req.body;

            if (!cantidad || !metodoPagoId) {
                return res.status(400).json({ error: 'Cantidad y Metodo de Pago requeridos' });
            }

            const result = await productoService.venderProducto(req.user!.barberiaId!, id, cantidad, metodoPagoId);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}

export const productoController = new ProductoController();
