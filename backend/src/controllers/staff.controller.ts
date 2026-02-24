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

    async getBarbero(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id as string; // profileId
            const barbero = await staffService.getBarbero(id);
            if (!barbero) return res.status(404).json({ error: 'Barbero no encontrado' });
            res.status(200).json(barbero);
        } catch (error: any) {
            res.status(500).json({ error: 'Error al obtener barbero' });
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

    async deleteBarbero(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id as string; // profileId
            await staffService.deleteBarbero(id);
            res.status(200).json({ message: 'Barbero dado de baja exitosamente' });
        } catch (error: any) {
            res.status(400).json({ error: 'Error al dar de baja al barbero' });
        }
    }

    async updateBarbero(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id as string; // profileId
            const data = req.body;
            const result = await staffService.updateBarbero(id, data);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Error al actualizar barbero' });
        }
    }
}

export const staffController = new StaffController();
