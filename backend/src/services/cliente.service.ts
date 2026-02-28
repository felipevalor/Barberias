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

        // Validar que el nuevo email no esté en uso por otro cliente de la misma barbería (case-insensitive)
        if (data.email && data.email.trim() !== "" && data.email.trim().toLowerCase() !== (cliente.email?.toLowerCase() || "")) {
            const normalizedEmail = data.email.trim().toLowerCase();

            // Búsqueda más robusta para evitar duplicados accidentales
            const existingEmail = await prisma.cliente.findFirst({
                where: {
                    barberiaId,
                    email: {
                        contains: normalizedEmail
                    },
                    id: { not: clienteId }
                }
            });

            // Verificación manual por si 'contains' es muy amplio o SQLite se comporta raro
            if (existingEmail && existingEmail.email?.toLowerCase() === normalizedEmail) {
                throw new Error('El email ya está registrado para otro cliente en esta barbería');
            }
        }

        return prisma.cliente.update({
            where: { id: clienteId },
            data: {
                nombre: data.nombre ? data.nombre.trim() : cliente.nombre,
                email: data.email?.trim() || null,
                telefono: data.telefono?.trim() || null,
                notasPreferencias: data.notasPreferencias
            }
        });
    }

    async deleteCliente(clienteId: string, barberiaId: string) {
        const cliente = await prisma.cliente.findFirst({
            where: { id: clienteId, barberiaId }
        });

        if (!cliente) throw new Error('Cliente no encontrado');

        // Eliminar turnos y transacciones asociadas (o dejarlas huérfanas si el esquema lo permite)
        // Por seguridad y simplicidad en este MVP, eliminamos el cliente. 
        // Prisma lanzará error si hay relaciones obligatorias sin onDelete: Cascade.
        return prisma.cliente.delete({
            where: { id: clienteId }
        });
    }
}

export const clienteService = new ClienteService();
