import { prisma } from '../config/db';
import bcrypt from 'bcrypt';

export class StaffService {
    async createBarbero(barberiaId: string, data: { nombre: string, email: string, telefono?: string, especialidad?: string }) {
        // 1. Crear usuario con rol BARBERO
        const hashedPassword = await bcrypt.hash('123456', 10); // Contraseña por defecto

        const result = await prisma.$transaction(async (tx: any) => {
            const newUser = await tx.user.create({
                data: {
                    nombre: data.nombre,
                    email: data.email,
                    password: hashedPassword,
                    role: 'BARBERO',
                    barberiaId,
                },
            });

            // 2. Crear BarberoProfile
            const newProfile = await tx.barberoProfile.create({
                data: {
                    userId: newUser.id,
                    telefono: data.telefono,
                    especialidad: data.especialidad,
                },
            });

            return { user: newUser, profile: newProfile };
        });

        return result;
    }

    async getBarberos(barberiaId: string) {
        return prisma.user.findMany({
            where: {
                barberiaId,
                role: 'BARBERO',
            },
            include: {
                BarberoProfile: {
                    include: {
                        horarios: {
                            include: { descansos: true }
                        },
                        ausencias: true
                    }
                },
            },
        });
    }

    async setHorarios(profileId: string, horarios: any[]) {
        // Borrar horarios viejos y recrear
        await prisma.horarioLaboral.deleteMany({
            where: { barberoId: profileId },
        });

        const createdHorarios = [];
        for (const h of horarios) {
            const created = await prisma.horarioLaboral.create({
                data: {
                    barberoId: profileId,
                    diaSemana: h.diaSemana,
                    horaInicio: h.horaInicio,
                    horaFin: h.horaFin,
                    descansos: {
                        create: h.descansos || [],
                    }
                },
            });
            createdHorarios.push(created);
        }
        return createdHorarios;
    }

    async addAusencia(profileId: string, fechaInicio: Date, fechaFin: Date, motivo?: string) {
        return prisma.ausencia.create({
            data: {
                barberoId: profileId,
                fechaInicio,
                fechaFin,
                motivo: motivo || null,
            },
        });
    }
}

export const staffService = new StaffService();
