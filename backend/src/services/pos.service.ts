import { prisma } from '../config/db';

export class POSService {
    async getMetodosPago(barberiaId: string) {
        return prisma.metodoPago.findMany({
            where: { barberiaId, activo: true }
        });
    }

    async createMetodoPago(barberiaId: string, nombre: string) {
        return prisma.metodoPago.create({
            data: { barberiaId, nombre }
        });
    }

    async checkoutTurno(barberiaId: string, turnoId: string, data: { metodoPagoId: string, montoCobrado: number, propina?: number }) {
        // 1. Obtener turno y verificar que pertenece a la barberia
        const turno = await prisma.turno.findFirst({
            where: { id: turnoId, barberiaId },
            include: { servicio: true }
        });

        if (!turno) throw new Error('Turno no encontrado');
        if (turno.estado === 'FINALIZADO') throw new Error('El turno ya fue cobrado');

        // 2. Transacción Atómica
        return prisma.$transaction(async (tx) => {
            // 2.a Marcar el turno como finalizado
            await tx.turno.update({
                where: { id: turnoId },
                data: { estado: 'FINALIZADO' }
            });

            // 2.b Generar Ingreso Principal
            const txIngreso = await tx.transaccion.create({
                data: {
                    barberiaId,
                    turnoId,
                    clienteId: turno.clienteId,
                    monto: data.montoCobrado,
                    tipo: 'INGRESO',
                    metodoPagoId: data.metodoPagoId,
                    descripcion: `Pago de Turno: ${turno.servicio.nombre}`
                }
            });

            // 2.c Generar Ingreso de Propina (opcional)
            if (data.propina && data.propina > 0) {
                await tx.transaccion.create({
                    data: {
                        barberiaId,
                        turnoId,
                        monto: data.propina,
                        tipo: 'INGRESO',
                        metodoPagoId: data.metodoPagoId,
                        descripcion: `Propina - Barbero: ${turno.barberoId}`
                    }
                });
            }

            return txIngreso;
        });
    }

    async registrarGasto(barberiaId: string, data: { monto: number, metodoPagoId: string, descripcion: string }) {
        return prisma.transaccion.create({
            data: {
                barberiaId,
                monto: data.monto,
                tipo: 'EGRESO',
                metodoPagoId: data.metodoPagoId,
                descripcion: data.descripcion
            }
        });
    }

    async getFlujoCaja(barberiaId: string, fechaInicio: Date, fechaFin: Date) {
        const transacciones = await prisma.transaccion.findMany({
            where: {
                barberiaId,
                fecha: {
                    gte: fechaInicio,
                    lte: fechaFin
                }
            },
            include: {
                metodoPago: true,
                turno: { include: { servicio: true, cliente: true } }
            },
            orderBy: { fecha: 'desc' }
        });

        // Calcular totales
        const resumen = transacciones.reduce((acc, t) => {
            if (t.tipo === 'INGRESO') acc.totalIngresos += t.monto;
            if (t.tipo === 'EGRESO') acc.totalEgresos += t.monto;
            return acc;
        }, { totalIngresos: 0, totalEgresos: 0 });

        return {
            resumen: {
                ...resumen,
                balance: resumen.totalIngresos - resumen.totalEgresos
            },
            transacciones
        };
    }
}

export const posService = new POSService();
