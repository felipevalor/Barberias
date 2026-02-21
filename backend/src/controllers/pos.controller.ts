import { Response } from 'express';
import { posService } from '../services/pos.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class POSController {

    // -- MÉTODOS DE PAGO --
    async getMetodos(req: AuthRequest, res: Response) {
        try {
            const result = await posService.getMetodosPago(req.user!.barberiaId!);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async createMetodo(req: AuthRequest, res: Response) {
        try {
            const { nombre } = req.body;
            if (!nombre) return res.status(400).json({ error: 'Nombre es requerido' });

            const result = await posService.createMetodoPago(req.user!.barberiaId!, nombre);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // -- TRANSACCIONES --
    async checkout(req: AuthRequest, res: Response) {
        try {
            const turnoId = req.params.turnoId as string;
            const { metodoPagoId, montoCobrado, propina } = req.body;

            if (!metodoPagoId || montoCobrado === undefined) {
                return res.status(400).json({ error: 'Faltan datos de cobro' });
            }

            const result = await posService.checkoutTurno(req.user!.barberiaId!, turnoId, { metodoPagoId, montoCobrado, propina });
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async registrarGasto(req: AuthRequest, res: Response) {
        try {
            const data = req.body;
            const result = await posService.registrarGasto(req.user!.barberiaId!, data);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getCajaDiaria(req: AuthRequest, res: Response) {
        try {
            // Por defecto toma el día actual si no pasan fechas
            const start = req.query.start ? new Date(req.query.start as string) : new Date(new Date().setHours(0, 0, 0, 0));
            const end = req.query.end ? new Date(req.query.end as string) : new Date(new Date().setHours(23, 59, 59, 999));

            const result = await posService.getFlujoCaja(req.user!.barberiaId!, start, end);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const posController = new POSController();
