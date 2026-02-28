import { Response } from 'express';
import { clienteService } from '../services/cliente.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ClienteController {
    async getClientes(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            const q = req.query.q as string;

            const clientes = await clienteService.getClientes(barberiaId!, q);
            res.status(200).json(clientes);
        } catch (error: any) {
            res.status(500).json({ error: 'Error al obtener clientes' });
        }
    }

    async getClienteDetalle(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            const id = req.params.id as string;

            const cliente = await clienteService.getClienteDetalle(id, barberiaId!);
            res.status(200).json(cliente);
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    }

    async updateCliente(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            const id = req.params.id as string;
            const data = req.body;

            const result = await clienteService.updateCliente(id, barberiaId!, data);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteCliente(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            const id = req.params.id as string;

            await clienteService.deleteCliente(id, barberiaId!);
            res.status(200).json({ message: 'Cliente eliminado correctamente' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}

export const clienteController = new ClienteController();
