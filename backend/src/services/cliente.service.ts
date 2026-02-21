import { prisma } from '../config/db';

export class ClienteService {
    async getClientes(barberiaId: string, search?: string) {
        const where: any = { barberiaId };

        if (search) {
            where.OR = [
                { nombre: { contains: search } },
                { telefono: { contains: search } },
                { email: { contains: search } }
            ];
        }

        // Obtener clientes con cantidad de turnos histórica
        return prisma.cliente.findMany({
            where,
            include: {
                _count: {
                    select: { turnos: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getClienteDetalle(clienteId: string, barberiaId: string) {
        const cliente = await prisma.cliente.findFirst({
            where: { id: clienteId, barberiaId },
            include: {
                turnos: {
                    include: {
                        servicio: true,
                        barbero: { include: { user: true } }
                    },
                    orderBy: { fechaHoraInicio: 'desc' }
                }
            }
        });

        if (!cliente) throw new Error('Cliente no encontrado');
        return cliente;
    }

    async updateCliente(clienteId: string, barberiaId: string, data: { nombre?: string, email?: string, telefono?: string, notasPreferencias?: string }) {
        const cliente = await prisma.cliente.findFirst({
            where: { id: clienteId, barberiaId }
        });

        if (!cliente) throw new Error('Cliente no encontrado');

        return prisma.cliente.update({
            where: { id: clienteId },
            data
        });
    }
}

export const clienteService = new ClienteService();
