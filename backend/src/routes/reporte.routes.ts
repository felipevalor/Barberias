import { Response, Router } from 'express';
import { reporteService } from '../services/reporte.service';
import { AuthRequest, verifyToken, requireRole } from '../middlewares/auth.middleware';

export class ReporteController {
    async getRendimiento(req: AuthRequest, res: Response) {
        try {
            const start = req.query.start ? new Date(req.query.start as string) : new Date(new Date().setDate(1)); // Primer dia del mes default
            const end = req.query.end ? new Date(req.query.end as string) : new Date();

            const result = await reporteService.getRendimientoBarberos(req.user!.barberiaId!, start, end);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

const reporteController = new ReporteController();
const router = Router();

router.use(verifyToken);
// Solo el ADMIN puede ver los reportes globales de guita
router.get('/rendimiento', requireRole(['ADMIN', 'SUPERADMIN']), reporteController.getRendimiento.bind(reporteController));

export default router;
