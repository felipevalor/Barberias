import { prisma } from '../config/db';
import { emailService } from './email.service';

export class TurnoService {

    // ── Utilidades de Tiempo ──────────────────────────────────────────

    /**
     * Convierte una hora HH:MM a minutos desde el inicio del día (00:00)
     */
    private timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return (hours || 0) * 60 + (minutes || 0);
    }

    /**
     * Obtiene los minutos desde el inicio del día para una fecha dada en UTC
     */
    private dateToMinutesUTC(date: Date): number {
        return date.getUTCHours() * 60 + date.getUTCMinutes();
    }

    // ── Validaciones privadas ──────────────────────────────────────────

    /**
     * Valida que el turno caiga dentro del horario laboral del barbero
     * y no se superponga con descansos ni ausencias.
     */
    private async validarHorarioLaboral(tx: any, barberoId: string, fechaInicio: Date, fechaFin: Date) {
        // Usamos UTC para consistency
        const diaSemana = fechaInicio.getUTCDay();

        const horario = await tx.horarioLaboral.findFirst({
            where: { barberoId, diaSemana },
            include: { descansos: true }
        });

        if (!horario) {
            throw new Error('El barbero no trabaja este día');
        }

        const inicioTurnoMins = this.dateToMinutesUTC(fechaInicio);
        const finTurnoMins = this.dateToMinutesUTC(fechaFin);
        const inicioLaboralMins = this.timeToMinutes(horario.horaInicio);
        const finLaboralMins = this.timeToMinutes(horario.horaFin);

        if (inicioTurnoMins < inicioLaboralMins || finTurnoMins > finLaboralMins) {
            throw new Error(`El turno está fuera del horario laboral (${horario.horaInicio} - ${horario.horaFin})`);
        }

        // Verificar descansos
        for (const descanso of horario.descansos) {
            const inicioDescansoMins = this.timeToMinutes(descanso.horaInicio);
            const finDescansoMins = this.timeToMinutes(descanso.horaFin);

            if (inicioTurnoMins < finDescansoMins && finTurnoMins > inicioDescansoMins) {
                throw new Error(`El turno se superpone con el descanso (${descanso.horaInicio} - ${descanso.horaFin})`);
            }
        }

        // Verificar ausencias
        const ausencia = await tx.ausencia.findFirst({
            where: {
                barberoId,
                fechaInicio: { lte: fechaFin },
                fechaFin: { gte: fechaInicio }
            }
        });

        if (ausencia) {
            throw new Error('El barbero tiene una ausencia registrada en esa fecha');
        }
    }

    /**
     * Valida que no haya superposición de turnos activos.
     */
    private async validarSolapamiento(tx: any, barberoId: string, fechaInicio: Date, fechaFin: Date, excludeTurnoId?: string) {
        const solapamiento = await tx.turno.findFirst({
            where: {
                barberoId,
                estado: { in: ['PENDIENTE', 'EN_CURSO'] },
                id: excludeTurnoId ? { not: excludeTurnoId } : undefined,
                OR: [
                    { fechaHoraInicio: { lte: fechaInicio }, fechaHoraFin: { gt: fechaInicio } },
                    { fechaHoraInicio: { lt: fechaFin }, fechaHoraFin: { gte: fechaFin } },
                    { fechaHoraInicio: { gte: fechaInicio }, fechaHoraFin: { lte: fechaFin } }
                ]
            }
        });

        if (solapamiento) {
            throw new Error('El barbero ya tiene un turno reservado en ese horario');
        }
    }

    // ── Crear turno (Con Transacción) ──────────────────────────────────

    async crearTurno(data: { barberiaId: string, barberoId: string, clienteId: string, servicioId: string, fechaHoraInicio: Date }) {
        return await prisma.$transaction(async (tx) => {
            const { barberiaId, barberoId, clienteId, servicioId, fechaHoraInicio } = data;

            const servicio = await tx.servicio.findUnique({ where: { id: servicioId } });
            if (!servicio) throw new Error('Servicio no encontrado');

            const fechaHoraFin = new Date(fechaHoraInicio.getTime() + servicio.duracionMinutos * 60000);

            if (fechaHoraInicio < new Date()) {
                throw new Error('No se pueden crear turnos en el pasado');
            }

            await this.validarHorarioLaboral(tx, barberoId, fechaHoraInicio, fechaHoraFin);
            await this.validarSolapamiento(tx, barberoId, fechaHoraInicio, fechaHoraFin);

            const turno = await tx.turno.create({
                data: {
                    barberiaId,
                    barberoId,
                    clienteId,
                    servicioId,
                    fechaHoraInicio,
                    fechaHoraFin,
                    estado: 'PENDIENTE'
                },
                include: {
                    cliente: true,
                    barbero: { include: { user: true } },
                    servicio: true
                }
            });

            if (turno.cliente.email) {
                emailService.sendTurnoConfirmation(
                    turno.cliente.email,
                    turno.cliente.nombre,
                    turno.fechaHoraInicio,
                    turno.servicio.nombre
                ).catch(console.error);
            }

            return turno;
        });
    }

    // ── Obtener turnos ─────────────────────────────────────────────────

    async getTurnos(barberiaId: string, options?: { fechaInicio?: Date, fechaFin?: Date, barberoId?: string }) {
        const whereClause: any = { barberiaId };
        if (options?.barberoId) whereClause.barberoId = options.barberoId;
        if (options?.fechaInicio && options?.fechaFin) {
            whereClause.fechaHoraInicio = { gte: options.fechaInicio, lte: options.fechaFin };
        }

        return prisma.turno.findMany({
            where: whereClause,
            include: {
                cliente: true,
                barbero: { include: { user: true } },
                servicio: true
            },
            orderBy: { fechaHoraInicio: 'asc' }
        });
    }

    // ── Actualizar turno (Mover / Editar con Transacción) ──────────────

    async updateTurno(turnoId: string, barberiaId: string, data: { barberoId?: string, fechaHoraInicio?: string, servicioId?: string }) {
        return await prisma.$transaction(async (tx) => {
            const turno = await tx.turno.findFirst({
                where: { id: turnoId, barberiaId },
                include: { servicio: true }
            });

            if (!turno) throw new Error('Turno no encontrado');
            if (['FINALIZADO', 'CANCELADO', 'NO_ASISTIO'].includes(turno.estado)) {
                throw new Error('No se puede modificar un turno en estado final');
            }

            const newBarberoId = data.barberoId || turno.barberoId;
            let duracion = turno.servicio.duracionMinutos;

            if (data.servicioId && data.servicioId !== turno.servicioId) {
                const nuevoServicio = await tx.servicio.findUnique({ where: { id: data.servicioId } });
                if (!nuevoServicio) throw new Error('Servicio no encontrado');
                duracion = nuevoServicio.duracionMinutos;
            }

            const newInicio = data.fechaHoraInicio ? new Date(data.fechaHoraInicio) : turno.fechaHoraInicio;
            const newFin = new Date(newInicio.getTime() + duracion * 60000);

            await this.validarHorarioLaboral(tx, newBarberoId, newInicio, newFin);
            await this.validarSolapamiento(tx, newBarberoId, newInicio, newFin, turnoId);

            return tx.turno.update({
                where: { id: turnoId },
                data: {
                    barberoId: newBarberoId,
                    servicioId: data.servicioId || turno.servicioId,
                    fechaHoraInicio: newInicio,
                    fechaHoraFin: newFin
                },
                include: {
                    cliente: true,
                    barbero: { include: { user: true } },
                    servicio: true
                }
            });
        });
    }

    // ── Cambiar estado (Incluye Soft Delete lógico) ───────────────────

    async updateEstado(turnoId: string, barberiaId: string, estado: string) {
        const turno = await prisma.turno.findFirst({ where: { id: turnoId, barberiaId } });
        if (!turno) throw new Error('Turno no encontrado');

        // Si el estado es CANCELADO, lo tratamos como Soft Delete para liberar horario
        return prisma.turno.update({
            where: { id: turnoId },
            data: { estado },
            include: {
                cliente: true,
                barbero: { include: { user: true } },
                servicio: true
            }
        });
    }

    // ── Obtener bloqueos (descansos + ausencias) ───────────────────────

    async getBloqueos(barberiaId: string, fechaInicio: Date, fechaFin: Date) {
        const barberos = await prisma.barberoProfile.findMany({
            where: { user: { barberiaId } },
            include: {
                user: { select: { nombre: true } },
                horarios: { include: { descansos: true } },
                ausencias: { where: { fechaInicio: { lte: fechaFin }, fechaFin: { gte: fechaInicio } } }
            }
        });

        const bloqueos: any[] = [];
        const currentDate = new Date(fechaInicio);

        while (currentDate <= fechaFin) {
            const diaSemana = currentDate.getUTCDay();

            for (const barbero of barberos) {
                const horarioDelDia = barbero.horarios.find((h: any) => h.diaSemana === diaSemana);

                if (!horarioDelDia) {
                    const diaStart = new Date(currentDate);
                    diaStart.setUTCHours(0, 0, 0, 0);
                    const diaEnd = new Date(currentDate);
                    diaEnd.setUTCHours(23, 59, 59, 999);

                    bloqueos.push({
                        barberoId: barbero.id,
                        barberoNombre: barbero.user.nombre,
                        tipo: 'DIA_LIBRE',
                        inicio: diaStart.toISOString(),
                        fin: diaEnd.toISOString()
                    });
                } else {
                    for (const descanso of horarioDelDia.descansos) {
                        const [hIStr, mIStr] = descanso.horaInicio.split(':');
                        const [hFStr, mFStr] = descanso.horaFin.split(':');
                        const hI = Number(hIStr) || 0;
                        const mI = Number(mIStr) || 0;
                        const hF = Number(hFStr) || 0;
                        const mF = Number(mFStr) || 0;

                        const inicio = new Date(currentDate);
                        inicio.setUTCHours(hI, mI, 0, 0);
                        const fin = new Date(currentDate);
                        fin.setUTCHours(hF, mF, 0, 0);

                        bloqueos.push({
                            barberoId: barbero.id,
                            barberoNombre: barbero.user.nombre,
                            tipo: 'DESCANSO',
                            inicio: inicio.toISOString(),
                            fin: fin.toISOString()
                        });
                    }
                }

                for (const ausencia of barbero.ausencias) {
                    bloqueos.push({
                        barberoId: barbero.id,
                        barberoNombre: barbero.user.nombre,
                        tipo: 'AUSENCIA',
                        motivo: ausencia.motivo,
                        inicio: ausencia.fechaInicio.toISOString(),
                        fin: ausencia.fechaFin.toISOString()
                    });
                }
            }
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        return bloqueos;
    }
}

export const turnoService = new TurnoService();
