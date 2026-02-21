import { prisma } from '../config/db';
import { emailService } from './email.service';

export class TurnoService {

    // ── Validaciones privadas ──────────────────────────────────────────

    /**
     * Valida que el turno caiga dentro del horario laboral del barbero
     * y no se superponga con descansos ni ausencias.
     */
    private async validarHorarioLaboral(barberoId: string, fechaInicio: Date, fechaFin: Date) {
        const diaSemana = fechaInicio.getDay(); // 0=Dom, 1=Lun...

        // 1. Obtener horario laboral del barbero para ese día
        const horario = await prisma.horarioLaboral.findFirst({
            where: { barberoId, diaSemana },
            include: { descansos: true }
        });

        if (!horario) {
            throw new Error('El barbero no trabaja este día');
        }

        // Comparar horas como strings HH:MM
        const horaInicioTurno = `${String(fechaInicio.getUTCHours()).padStart(2, '0')}:${String(fechaInicio.getUTCMinutes()).padStart(2, '0')}`;
        const horaFinTurno = `${String(fechaFin.getUTCHours()).padStart(2, '0')}:${String(fechaFin.getUTCMinutes()).padStart(2, '0')}`;

        if (horaInicioTurno < horario.horaInicio || horaFinTurno > horario.horaFin) {
            throw new Error(`El turno está fuera del horario laboral del barbero (${horario.horaInicio} - ${horario.horaFin})`);
        }

        // 2. Verificar que no caiga dentro de un descanso
        for (const descanso of horario.descansos) {
            if (horaInicioTurno < descanso.horaFin && horaFinTurno > descanso.horaInicio) {
                throw new Error(`El turno se superpone con el descanso del barbero (${descanso.horaInicio} - ${descanso.horaFin})`);
            }
        }

        // 3. Verificar que no haya ausencia ese día
        const ausencia = await prisma.ausencia.findFirst({
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
     * Valida que no haya superposición de turnos activos para el barbero.
     * excludeTurnoId se usa para excluir el turno actual al moverlo.
     */
    private async validarSolapamiento(barberoId: string, fechaInicio: Date, fechaFin: Date, excludeTurnoId?: string) {
        const where: any = {
            barberoId,
            estado: { in: ['PENDIENTE', 'EN_CURSO'] },
            OR: [
                {
                    fechaHoraInicio: { lte: fechaInicio },
                    fechaHoraFin: { gt: fechaInicio }
                },
                {
                    fechaHoraInicio: { lt: fechaFin },
                    fechaHoraFin: { gte: fechaFin }
                },
                {
                    fechaHoraInicio: { gte: fechaInicio },
                    fechaHoraFin: { lte: fechaFin }
                }
            ]
        };

        if (excludeTurnoId) {
            where.id = { not: excludeTurnoId };
        }

        const solapamiento = await prisma.turno.findFirst({ where });

        if (solapamiento) {
            throw new Error('El barbero ya tiene un turno reservado en ese horario');
        }
    }

    // ── Crear turno ────────────────────────────────────────────────────

    async crearTurno(data: { barberiaId: string, barberoId: string, clienteId: string, servicioId: string, fechaHoraInicio: Date }) {
        const { barberiaId, barberoId, clienteId, servicioId, fechaHoraInicio } = data;

        // 1. Obtener duración del servicio
        const servicio = await prisma.servicio.findUnique({ where: { id: servicioId } });
        if (!servicio) throw new Error('Servicio no encontrado');

        const fechaHoraFin = new Date(fechaHoraInicio.getTime() + servicio.duracionMinutos * 60000);

        // 2. Validar que la fecha no sea en el pasado
        if (fechaHoraInicio < new Date()) {
            throw new Error('No se pueden crear turnos en el pasado');
        }

        // 3. Validar horario laboral, descansos y ausencias
        await this.validarHorarioLaboral(barberoId, fechaHoraInicio, fechaHoraFin);

        // 4. Validar solapamiento
        await this.validarSolapamiento(barberoId, fechaHoraInicio, fechaHoraFin);

        // 5. Crear el turno
        const turno = await prisma.turno.create({
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

        // 6. Enviar Notificación Email en background
        if (turno.cliente.email) {
            emailService.sendTurnoConfirmation(
                turno.cliente.email,
                turno.cliente.nombre,
                turno.fechaHoraInicio,
                turno.servicio.nombre
            ).catch(console.error);
        }

        return turno;
    }

    // ── Obtener turnos ─────────────────────────────────────────────────

    async getTurnos(barberiaId: string, options?: { fechaInicio?: Date, fechaFin?: Date, barberoId?: string }) {
        const whereClause: any = { barberiaId };

        if (options?.barberoId) whereClause.barberoId = options.barberoId;

        if (options?.fechaInicio && options?.fechaFin) {
            whereClause.fechaHoraInicio = {
                gte: options.fechaInicio,
                lte: options.fechaFin
            };
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

    // ── Actualizar turno (mover / editar) ──────────────────────────────

    async updateTurno(turnoId: string, barberiaId: string, data: { barberoId?: string, fechaHoraInicio?: string, servicioId?: string }) {
        const turno = await prisma.turno.findFirst({
            where: { id: turnoId, barberiaId },
            include: { servicio: true }
        });

        if (!turno) throw new Error('Turno no encontrado');

        if (turno.estado === 'FINALIZADO' || turno.estado === 'CANCELADO') {
            throw new Error('No se puede modificar un turno finalizado o cancelado');
        }

        const newBarberoId = data.barberoId || turno.barberoId;
        const newServicioId = data.servicioId || turno.servicioId;

        // Si cambió el servicio, obtener nueva duración
        let duracion = turno.servicio.duracionMinutos;
        if (data.servicioId && data.servicioId !== turno.servicioId) {
            const nuevoServicio = await prisma.servicio.findUnique({ where: { id: data.servicioId } });
            if (!nuevoServicio) throw new Error('Servicio no encontrado');
            duracion = nuevoServicio.duracionMinutos;
        }

        const newInicio = data.fechaHoraInicio ? new Date(data.fechaHoraInicio) : turno.fechaHoraInicio;
        const newFin = new Date(newInicio.getTime() + duracion * 60000);

        // Validar horario laboral
        await this.validarHorarioLaboral(newBarberoId, newInicio, newFin);

        // Validar solapamiento (excluyendo este turno)
        await this.validarSolapamiento(newBarberoId, newInicio, newFin, turnoId);

        return prisma.turno.update({
            where: { id: turnoId },
            data: {
                barberoId: newBarberoId,
                servicioId: newServicioId,
                fechaHoraInicio: newInicio,
                fechaHoraFin: newFin
            },
            include: {
                cliente: true,
                barbero: { include: { user: true } },
                servicio: true
            }
        });
    }

    // ── Cambiar estado ─────────────────────────────────────────────────

    async updateEstado(turnoId: string, barberiaId: string, estado: string) {
        const turno = await prisma.turno.findFirst({
            where: { id: turnoId, barberiaId }
        });

        if (!turno) throw new Error('Turno no encontrado');

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
        // Obtener todos los barberos de la barbería con sus horarios y ausencias
        const barberos = await prisma.barberoProfile.findMany({
            where: {
                user: { barberiaId }
            },
            include: {
                user: { select: { nombre: true } },
                horarios: {
                    include: { descansos: true }
                },
                ausencias: {
                    where: {
                        fechaInicio: { lte: fechaFin },
                        fechaFin: { gte: fechaInicio }
                    }
                }
            }
        });

        const bloqueos: any[] = [];

        // Generar bloques de descanso para cada día en el rango
        const currentDate = new Date(fechaInicio);
        while (currentDate <= fechaFin) {
            const diaSemana = currentDate.getDay();

            for (const barbero of barberos) {
                const horarioDelDia = barbero.horarios.find((h: any) => h.diaSemana === diaSemana);

                if (!horarioDelDia) {
                    // El barbero no trabaja este día — bloquear todo el día
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
                    // Agregar descansos
                    for (const descanso of horarioDelDia.descansos) {
                        const parts1 = descanso.horaInicio.split(':').map(Number);
                        const parts2 = descanso.horaFin.split(':').map(Number);
                        const hI = parts1[0] ?? 0, mI = parts1[1] ?? 0;
                        const hF = parts2[0] ?? 0, mF = parts2[1] ?? 0;

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

                // Agregar ausencias
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

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return bloqueos;
    }
}

export const turnoService = new TurnoService();
