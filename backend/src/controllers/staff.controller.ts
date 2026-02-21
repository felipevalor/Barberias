import { Response } from 'express';
import { staffService } from '../services/staff.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class StaffController {
    async createBarbero(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            if (!barberiaId) return res.status(403).json({ error: 'No tienes una barbería asignada' });

            const data = req.body;
            if (!data.nombre || !data.email) {
                return res.status(400).json({ error: 'Nombre y email son obligatorios' });
            }

            const result = await staffService.createBarbero(barberiaId, data);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Error al crear barbero' });
        }
    }

    async getBarberos(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            if (!barberiaId) return res.status(403).json({ error: 'No tienes una barbería asignada' });

            const barberos = await staffService.getBarberos(barberiaId);
            res.status(200).json(barberos);
        } catch (error: any) {
            res.status(500).json({ error: 'Error al obtener barberos' });
        }
    }

    async setHorarios(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id as string; // profileId
            const { horarios } = req.body;

            const result = await staffService.setHorarios(id, horarios);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ error: 'Error al configurar horarios' });
        }
    }

    async setAusencia(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id as string; // profileId
            const { fechaInicio, fechaFin, motivo } = req.body;

            const result = await staffService.addAusencia(id, new Date(fechaInicio), new Date(fechaFin), motivo);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: 'Error al registrar ausencia' });
        }
    }
}

export const staffController = new StaffController();
