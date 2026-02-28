import { Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class DashboardController {
    async getDashboard(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            if (!barberiaId) return res.status(403).json({ error: 'Operación no permitida' });

            const data = await dashboardService.getDashboardData(barberiaId);
            res.status(200).json(data);
        } catch (error: any) {
            res.status(500).json({ error: 'Error al obtener datos del dashboard' });
        }
    }
}

export const dashboardController = new DashboardController();
