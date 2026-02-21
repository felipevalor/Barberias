import { Response } from 'express';
import { turnoService } from '../services/turno.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../config/db';

export class TurnoController {
    async crearTurno(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            if (!barberiaId) return res.status(403).json({ error: 'Operación no permitida' });

            // Si viene clienteId se usa, sino se crea/busca un cliente simple (Para UI rápida)
            let { clienteId, nombreCliente, telefonoCliente, barberoId, servicioId, fechaHoraInicio } = req.body;

            if (!clienteId && nombreCliente) {
                const nuevoCliente = await prisma.cliente.create({
                    data: {
                        barberiaId,
                        nombre: nombreCliente,
                        telefono: telefonoCliente
                    }
                });
                clienteId = nuevoCliente.id;
            }

            if (!clienteId || !barberoId || !servicioId || !fechaHoraInicio) {
                return res.status(400).json({ error: 'Faltan datos obligatorios para agendar' });
            }

            const inicio = new Date(fechaHoraInicio);

            const result = await turnoService.crearTurno({
                barberiaId,
                barberoId,
                clienteId,
                servicioId,
                fechaHoraInicio: inicio
            });

            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Error al agendar turno' });
        }
    }

    async getTurnos(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;

            let options: any = {};

            // Parsear request params opcionales
            if (req.query.fechaInicio && req.query.fechaFin) {
                options.fechaInicio = new Date(req.query.fechaInicio as string);
                options.fechaFin = new Date(req.query.fechaFin as string);
            }
            if (req.query.barberoId) {
                options.barberoId = req.query.barberoId;
            }

            const turnos = await turnoService.getTurnos(barberiaId!, options);
            res.status(200).json(turnos);
        } catch (error: any) {
            res.status(500).json({ error: 'Error al obtener agenda' });
        }
    }

    async updateTurno(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            if (!barberiaId) return res.status(403).json({ error: 'Operación no permitida' });

            const turnoId = req.params.id as string;
            const { barberoId, fechaHoraInicio, servicioId } = req.body;

            const result = await turnoService.updateTurno(turnoId, barberiaId, {
                barberoId,
                fechaHoraInicio,
                servicioId
            });

            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Error al actualizar turno' });
        }
    }

    async cambiarEstado(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            const turnoId = req.params.id as string;
            const { estado } = req.body;

            const validStates = ['PENDIENTE', 'EN_CURSO', 'FINALIZADO', 'CANCELADO', 'NO_ASISTIO'];
            if (!validStates.includes(estado)) {
                return res.status(400).json({ error: 'Estado de turno inválido' });
            }

            const result = await turnoService.updateEstado(turnoId, barberiaId!, estado);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Error al actualizar estado' });
        }
    }

    async getBloqueos(req: AuthRequest, res: Response) {
        try {
            const { barberiaId } = req.user!;
            if (!barberiaId) return res.status(403).json({ error: 'Operación no permitida' });

            const fechaInicio = req.query.fechaInicio ? new Date(req.query.fechaInicio as string) : new Date();
            const fechaFin = req.query.fechaFin ? new Date(req.query.fechaFin as string) : new Date();

            const bloqueos = await turnoService.getBloqueos(barberiaId, fechaInicio, fechaFin);
            res.status(200).json(bloqueos);
        } catch (error: any) {
            res.status(500).json({ error: 'Error al obtener bloqueos' });
        }
    }
}

export const turnoController = new TurnoController();
