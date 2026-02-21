import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
    async register(req: Request, res: Response) {
        try {
            const { nombre, email, password, nombreBarberia } = req.body;
            if (!nombre || !email || !password || !nombreBarberia) {
                return res.status(400).json({ error: 'Todos los campos son obligatorios' });
            }

            const result = await authService.registerAdmin(nombre, email, password, nombreBarberia);
            res.status(201).json({ message: 'Barbería y Administrador creados exitosamente', result });
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Error en el registro' });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
            }

            const result = await authService.login(email, password);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(401).json({ error: error.message || 'Error en el inicio de sesión' });
        }
    }
}

export const authController = new AuthController();
