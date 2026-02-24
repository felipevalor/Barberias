import { prisma } from '../config/db';
import bcrypt from 'bcrypt';

export class StaffService {
    async createBarbero(barberiaId: string, data: { nombre: string, email: string, telefono?: string, especialidad?: string }) {
        // 1. Check if user already exists
        const emailTrimmed = data.email.trim();
        const existingUser = await prisma.user.findUnique({
            where: { email: emailTrimmed },
            include: { BarberoProfile: true }
        });

        if (existingUser) {
            // User exists, check if they belong to this barberia
            if (existingUser.barberiaId !== barberiaId) {
                throw new Error('El correo ya está registrado en otra barbería.');
            }
            // Check if they are already a barbero
            if (existingUser.BarberoProfile) {
                throw new Error('Este usuario ya está registrado como barbero.');
            }

            // Promote existing user to BARBERO if they aren't already
            return prisma.$transaction(async (tx: any) => {
                const updatedUser = await tx.user.update({
                    where: { id: existingUser.id },
                    data: { role: 'BARBERO' }
                });

                const newProfile = await tx.barberoProfile.create({
                    data: {
                        userId: updatedUser.id,
                        telefono: data.telefono,
                        especialidad: data.especialidad,
                    }
                });

                return { user: updatedUser, profile: newProfile };
            });
        }

        // 2. User doesn't exist, create everything from scratch
        const hashedPassword = await bcrypt.hash('123456', 10); // Contraseña por defecto

        return prisma.$transaction(async (tx: any) => {
            const newUser = await tx.user.create({
                data: {
                    nombre: data.nombre,
                    email: data.email,
                    password: hashedPassword,
                    role: 'BARBERO',
                    barberiaId,
                },
            });

            const newProfile = await tx.barberoProfile.create({
                data: {
                    userId: newUser.id,
                    telefono: data.telefono,
                    especialidad: data.especialidad,
                },
            });

            return { user: newUser, profile: newProfile };
        });
    }

    async getBarberos(barberiaId: string) {
        return prisma.user.findMany({
            where: {
                barberiaId,
                role: 'BARBERO',
                BarberoProfile: {
                    activo: true
                }
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

    async getBarbero(profileId: string) {
        return prisma.barberoProfile.findUnique({
            where: { id: profileId },
            include: {
                user: true,
                horarios: {
                    include: { descansos: true }
                },
                ausencias: true
            }
        });
    }

    async deleteBarbero(profileId: string) {
        return prisma.barberoProfile.update({
            where: { id: profileId },
            data: { activo: false }
        });
    }

    async updateBarbero(profileId: string, data: { nombre?: string, email?: string, telefono?: string, especialidad?: string }) {
        const profile = await prisma.barberoProfile.findUnique({
            where: { id: profileId },
            include: { user: true }
        });

        if (!profile) throw new Error('Perfil de barbero no encontrado');

        return prisma.$transaction(async (tx: any) => {
            // Actualizar User (nombre/email)
            if (data.nombre || data.email) {
                await tx.user.update({
                    where: { id: profile.userId },
                    data: {
                        nombre: data.nombre,
                        email: data.email
                    }
                });
            }

            // Actualizar Profile (telefono/especialidad)
            return tx.barberoProfile.update({
                where: { id: profileId },
                data: {
                    telefono: data.telefono,
                    especialidad: data.especialidad
                },
                include: { user: true }
            });
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
