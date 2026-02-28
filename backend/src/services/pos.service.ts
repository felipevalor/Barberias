import { prisma } from '../config/db';

export class POSService {
    async getMetodosPago(barberiaId: string) {
        const metodos = await prisma.metodoPago.findMany({
            where: { barberiaId, activo: true }
        });

        if (metodos.length === 0) {
            // Initialize defaults if none exist
            await prisma.metodoPago.createMany({
                data: [
                    { barberiaId, nombre: 'Efectivo' },
                    { barberiaId, nombre: 'Tarjeta' },
                    { barberiaId, nombre: 'Transferencia' }
                ]
            });
            return prisma.metodoPago.findMany({
                where: { barberiaId, activo: true }
            });
        }

        return metodos;
    }

    async createMetodoPago(barberiaId: string, nombre: string) {
        return prisma.metodoPago.create({
            data: { barberiaId, nombre }
        });
    }

    async checkoutTurno(barberiaId: string, turnoId: string, data: { metodoPagoId: string, montoCobrado: number, propina?: number, productos?: { id: string, cantidad: number }[] }) {
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
            const updatedTurno = await tx.turno.update({
                where: { id: turnoId },
                data: { estado: 'FINALIZADO' }
            });

            // 2.b Generar Ingreso Principal (Servicio)
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

            // 2.d Procesar Productos (si hay)
            if (data.productos && data.productos.length > 0) {
                for (const p of data.productos) {
                    const producto = await tx.producto.findFirst({
                        where: { id: p.id, barberiaId }
                    });

                    if (!producto) throw new Error(`Producto ${p.id} no encontrado`);
                    if (producto.stockActual < p.cantidad) {
                        throw new Error(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stockActual}`);
                    }

                    // Descontar stock
                    await tx.producto.update({
                        where: { id: p.id },
                        data: { stockActual: producto.stockActual - p.cantidad }
                    });

                    // Crear transacción por producto
                    await tx.transaccion.create({
                        data: {
                            barberiaId,
                            turnoId,
                            clienteId: turno.clienteId,
                            monto: producto.precioVenta * p.cantidad,
                            tipo: 'INGRESO',
                            metodoPagoId: data.metodoPagoId,
                            descripcion: `Venta: ${p.cantidad}x ${producto.nombre}`
                        }
                    });
                }
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
