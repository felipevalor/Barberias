import { prisma } from '../config/db';

export class DashboardService {

    async getDashboardData(barberiaId: string) {
        const now = new Date();

        // ── Cálculo de rangos de fecha ────────────────────────────────────
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Domingo de esta semana

        const sevenDaysAgo = new Date(todayStart);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        // ── Queries en paralelo ──────────────────────────────────────────
        const [
            ingresosHoy,
            turnosHoy,
            transaccionesMes,
            turnosStaffSemana,
            proximosTurnos,
            transacciones7dias
        ] = await Promise.all([

            // 1. Ingresos del día
            prisma.transaccion.aggregate({
                where: {
                    barberiaId,
                    tipo: 'INGRESO',
                    fecha: { gte: todayStart, lte: todayEnd }
                },
                _sum: { monto: true }
            }),

            // 2. Turnos de hoy (todos)
            prisma.turno.findMany({
                where: {
                    barberiaId,
                    fechaHoraInicio: { gte: todayStart, lte: todayEnd }
                },
                select: { estado: true }
            }),

            // 3. Transacciones del mes (para ticket promedio)
            prisma.transaccion.aggregate({
                where: {
                    barberiaId,
                    tipo: 'INGRESO',
                    fecha: { gte: monthStart, lte: todayEnd },
                    turnoId: { not: null }
                },
                _avg: { monto: true },
                _count: true
            }),

            // 4. Turnos finalizados de la semana (para staff)
            prisma.turno.findMany({
                where: {
                    barberiaId,
                    estado: 'FINALIZADO',
                    fechaHoraInicio: { gte: weekStart, lte: todayEnd }
                },
                include: {
                    barbero: { include: { user: { select: { nombre: true } } } },
                    transacciones: {
                        where: { tipo: 'INGRESO' },
                        select: { monto: true }
                    }
                }
            }),

            // 5. Próximos 5 turnos
            prisma.turno.findMany({
                where: {
                    barberiaId,
                    estado: 'PENDIENTE',
                    fechaHoraInicio: { gte: now, lte: todayEnd }
                },
                include: {
                    cliente: { select: { nombre: true } },
                    barbero: { include: { user: { select: { nombre: true } } } },
                    servicio: { select: { nombre: true, duracionMinutos: true } }
                },
                orderBy: { fechaHoraInicio: 'asc' },
                take: 5
            }),

            // 6. Ingresos últimos 7 días
            prisma.transaccion.findMany({
                where: {
                    barberiaId,
                    tipo: 'INGRESO',
                    fecha: { gte: sevenDaysAgo, lte: todayEnd }
                },
                select: { monto: true, fecha: true }
            })
        ]);

        // ── Procesamiento ────────────────────────────────────────────────

        // Turnos de hoy desglosados
        const turnosDesglose = {
            total: turnosHoy.length,
            pendientes: turnosHoy.filter(t => t.estado === 'PENDIENTE').length,
            finalizados: turnosHoy.filter(t => t.estado === 'FINALIZADO').length,
            cancelados: turnosHoy.filter(t => t.estado === 'CANCELADO').length
        };

        // Staff performance (agrupar por barbero)
        const staffMap = new Map<string, { nombre: string; clientes: number; ingresos: number }>();
        for (const turno of turnosStaffSemana) {
            const barberoId = turno.barbero.id;
            const barberoNombre = turno.barbero.user.nombre;
            const ingresosTurno = turno.transacciones.reduce((sum, t) => sum + t.monto, 0);

            const existing = staffMap.get(barberoId);
            if (existing) {
                existing.clientes += 1;
                existing.ingresos += ingresosTurno;
            } else {
                staffMap.set(barberoId, { nombre: barberoNombre, clientes: 1, ingresos: ingresosTurno });
            }
        }
        const staffRendimiento = Array.from(staffMap.values())
            .sort((a, b) => b.ingresos - a.ingresos);

        // Ingresos por día (últimos 7 días)
        const diasLabels: string[] = [];
        const ingresoPorDia = new Map<string, number>();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayStart);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0]!; // YYYY-MM-DD
            diasLabels.push(key);
            ingresoPorDia.set(key, 0);
        }
        for (const tx of transacciones7dias) {
            const key = new Date(tx.fecha).toISOString().split('T')[0]!;
            if (ingresoPorDia.has(key)) {
                ingresoPorDia.set(key, (ingresoPorDia.get(key) ?? 0) + tx.monto);
            }
        }
        const chartData = diasLabels.map(dia => ({
            dia,
            ingresos: Math.round((ingresoPorDia.get(dia) || 0) * 100) / 100
        }));

        // ── Response ─────────────────────────────────────────────────────
        return {
            ingresosHoy: ingresosHoy._sum.monto || 0,
            turnosHoy: turnosDesglose,
            ticketPromedioMes: Math.round((transaccionesMes._avg.monto || 0) * 100) / 100,
            staffRendimiento,
            proximosTurnos: proximosTurnos.map(t => ({
                id: t.id,
                hora: t.fechaHoraInicio,
                cliente: t.cliente.nombre,
                barbero: t.barbero.user.nombre,
                servicio: t.servicio.nombre,
                duracion: t.servicio.duracionMinutos
            })),
            chartIngresos7Dias: chartData
        };
    }
}

export const dashboardService = new DashboardService();
