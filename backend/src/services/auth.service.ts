import { prisma } from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export class AuthService {
    async registerAdmin(nombre: string, email: string, password: string, nombreBarberia: string) {
        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('El usuario ya existe con este email.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear la barbería y el usuario en una transacción
        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Crear usuario Admin (aún sin barbería asignada)
            const newUser = await tx.user.create({
                data: {
                    nombre,
                    email,
                    password: hashedPassword,
                    role: 'ADMIN',
                },
            });

            // 2. Crear barbería y asignarle el admin
            const newBarberia = await tx.barberia.create({
                data: {
                    nombre: nombreBarberia,
                    adminId: newUser.id,
                },
            });

            // 3. Actualizar al usuario para enlazarlo con su barbería
            await tx.user.update({
                where: { id: newUser.id },
                data: { barberiaId: newBarberia.id },
            });

            // 4. Inicializar métodos de pago por defecto
            await tx.metodoPago.createMany({
                data: [
                    { barberiaId: newBarberia.id, nombre: 'Efectivo' },
                    { barberiaId: newBarberia.id, nombre: 'Tarjeta' },
                    { barberiaId: newBarberia.id, nombre: 'Transferencia' }
                ]
            });

            return { user: newUser, barberia: newBarberia };
        });

        return result;
    }

    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error('Credenciales inválidas');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Credenciales inválidas');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, barberiaId: user.barberiaId },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return { token, user: { id: user.id, nombre: user.nombre, role: user.role, barberiaId: user.barberiaId } };
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new Error('La contraseña actual es incorrecta');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        return prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        });
    }
}

export const authService = new AuthService();
