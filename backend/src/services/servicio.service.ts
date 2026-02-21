import { prisma } from '../config/db';

export class ServicioService {
    async createServicio(barberiaId: string, data: { nombre: string, descripcion?: string, precio: number, duracionMinutos: number, barberoIds?: string[] }) {
        const { nombre, descripcion, precio, duracionMinutos, barberoIds } = data;

        const dataToCreate: any = {
            barberiaId,
            nombre,
            descripcion: descripcion || null,
            precio,
            duracionMinutos,
        };

        if (barberoIds && barberoIds.length > 0) {
            dataToCreate.barberos = {
                connect: barberoIds.map(id => ({ id }))
            };
        }

        return prisma.servicio.create({
            data: dataToCreate,
            include: {
                barberos: true
            }
        });
    }

    async getServicios(barberiaId: string, onlyActivos = false) {
        return prisma.servicio.findMany({
            where: {
                barberiaId,
                ...(onlyActivos ? { activo: true } : {})
            },
            include: {
                barberos: {
                    include: {
                        user: {
                            select: { nombre: true }
                        }
                    }
                }
            }
        });
    }

    async toggleActivo(servicioId: string, barberiaId: string, activo: boolean) {
        // Verificamos que el servicio pertenezca a la barberia
        const servicio = await prisma.servicio.findFirst({
            where: { id: servicioId, barberiaId }
        });

        if (!servicio) throw new Error('Servicio no encontrado');

        return prisma.servicio.update({
            where: { id: servicioId },
            data: { activo }
        });
    }

    async updateServicio(servicioId: string, barberiaId: string, data: { precio?: number, barberoIds?: string[] }) {
        const servicio = await prisma.servicio.findFirst({
            where: { id: servicioId, barberiaId }
        });

        if (!servicio) throw new Error('Servicio no encontrado');

        const updateData: any = {};
        if (data.precio !== undefined) updateData.precio = data.precio;
        if (data.barberoIds) {
            updateData.barberos = {
                set: data.barberoIds.map(id => ({ id }))
            };
        }

        return prisma.servicio.update({
            where: { id: servicioId },
            data: updateData,
            include: {
                barberos: true
            }
        });
    }
}

export const servicioService = new ServicioService();
