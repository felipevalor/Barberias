import { Response } from 'express';
import { servicioService } from '../services/servicio.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ServicioController {
    async createServicio(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            if (!barberiaId) return res.status(403).json({ error: 'No tienes una barbería asignada' });

            const data = req.body;
            if (!data.nombre || data.precio === undefined || !data.duracionMinutos) {
                return res.status(400).json({ error: 'Nombre, precio y duración son obligatorios' });
            }

            const result = await servicioService.createServicio(barberiaId, data);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Error al crear servicio' });
        }
    }

    async getServicios(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            if (!barberiaId) return res.status(403).json({ error: 'No tienes una barbería asignada' });

            // Si query "activos" es provista, filtra solo listado activo.
            const onlyActivos = req.query.activos === 'true';

            const servicios = await servicioService.getServicios(barberiaId, onlyActivos);
            res.status(200).json(servicios);
        } catch (error: any) {
            res.status(500).json({ error: 'Error al obtener servicios' });
        }
    }

    async updateEstado(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            const id = req.params.id as string;
            const { activo } = req.body;

            if (activo === undefined) {
                return res.status(400).json({ error: 'Estado activo es obligatorio' });
            }

            const result = await servicioService.toggleActivo(id, barberiaId!, activo);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Error al actualizar servicio' });
        }
    }

    async updateServicio(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            const id = req.params.id as string;
            const data = req.body;

            const result = await servicioService.updateServicio(id, barberiaId!, data);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Error al modificar servicio' });
        }
    }
}

export const servicioController = new ServicioController();
