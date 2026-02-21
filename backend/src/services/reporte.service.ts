import { prisma } from '../config/db';

export class ReporteService {

    // RF-30: Reporte de Rendimiento por Barbero
    async getRendimientoBarberos(barberiaId: string, start: Date, end: Date) {
        const turnosFinalizados = await prisma.turno.findMany({
            where: {
                barberiaId,
                estado: 'FINALIZADO',
                fechaHoraInicio: {
                    gte: start,
                    lte: end
                }
            },
            include: {
                barbero: { include: { user: true } },
                servicio: true
            }
        });

        // Agrupar por barbero
        const rendimiento = turnosFinalizados.reduce((acc: any, turno) => {
            const bId = turno.barberoId;
            if (!acc[bId]) {
                acc[bId] = {
                    barberoId: bId,
                    nombre: turno.barbero.user.nombre,
                    serviciosRealizados: 0,
                    ingresosGenerados: 0
                };
            }

            acc[bId].serviciosRealizados += 1;
            acc[bId].ingresosGenerados += turno.servicio.precio;
            return acc;
        }, {});

        // Convertir a array y ordenar por ingresos desc
        return Object.values(rendimiento).sort((a: any, b: any) => b.ingresosGenerados - a.ingresosGenerados);
    }
}

export const reporteService = new ReporteService();
