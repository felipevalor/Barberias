'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format } from 'date-fns';
import { parse } from 'date-fns';
import { startOfWeek } from 'date-fns';
import { getDay } from 'date-fns';
import { startOfDay } from 'date-fns';
import { endOfDay } from 'date-fns';
import { addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './agenda-calendar.css';
import toast from 'react-hot-toast';
import { Plus, RefreshCcw } from 'lucide-react';
import Button from '@/components/ui/Button';

import NuevoTurnoModal from '@/components/agenda/NuevoTurnoModal';
import TurnoDetailModal from '@/components/agenda/TurnoDetailModal';
import CheckoutModal from '@/components/pos/CheckoutModal';

const locales = { 'es': es };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

const DnDCalendar = withDragAndDrop(Calendar as any);

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Colores de estado
const STATE_CLASSES: Record<string, string> = {
    'PENDIENTE': 'turno-pendiente',
    'EN_CURSO': 'turno-en-curso',
    'FINALIZADO': 'turno-finalizado',
    'CANCELADO': 'turno-cancelado',
    'NO_ASISTIO': 'turno-no-asistio',
};

const STATE_COLORS_DOT: Record<string, string> = {
    'PENDIENTE': '#3b82f6', // blue-500
    'EN_CURSO': '#3b82f6', // blue-500
    'FINALIZADO': '#94a3b8', // slate-400
    'CANCELADO': '#cbd5e1', // slate-300
    'NO_ASISTIO': '#cbd5e1', // slate-300
};

export default function AgendaPage() {
    const [turnos, setTurnos] = useState<any[]>([]);
    const [bloqueos, setBloqueos] = useState<any[]>([]);
    const [barberos, setBarberos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>(Views.DAY);
    const [date, setDate] = useState(new Date());

    // Modals
    const [nuevoTurnoOpen, setNuevoTurnoOpen] = useState(false);
    const [preselectedBarberoId, setPreselectedBarberoId] = useState<string | undefined>();
    const [preselectedStart, setPreselectedStart] = useState<Date | undefined>();

    const [detailTurno, setDetailTurno] = useState<any>(null);
    const [checkoutTurno, setCheckoutTurno] = useState<any>(null);

    const { token } = useAuth();

    // Calcular rango de fechas según la vista activa
    const getDateRange = useCallback((currentDate: Date, currentView: View) => {
        let start: Date, end: Date;
        if (currentView === Views.MONTH) {
            start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
        } else if (currentView === Views.WEEK) {
            const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
            start = startOfDay(weekStart);
            end = endOfDay(addDays(weekStart, 6));
        } else {
            start = startOfDay(currentDate);
            end = endOfDay(currentDate);
        }
        return { start, end };
    }, []);

    // Fetch data
    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);

        try {
            const { start, end } = getDateRange(date, view);
            const params = `fechaInicio=${start.toISOString()}&fechaFin=${end.toISOString()}`;

            const [staffRes, turnosRes, bloqueosRes] = await Promise.all([
                fetch(`${API}/staff`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/turnos?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/turnos/bloqueos?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            if (staffRes.ok) {
                const staffData = await staffRes.json();
                setBarberos(staffData);
            }

            if (turnosRes.ok) {
                const turnosData = await turnosRes.json();
                const formattedTurnos = turnosData.map((t: any) => ({
                    ...t,
                    title: `${t.cliente.nombre} - ${t.servicio.nombre}`,
                    start: new Date(t.fechaHoraInicio),
                    end: new Date(t.fechaHoraFin),
                    resourceId: t.barberoId,
                    isDraggable: t.estado === 'PENDIENTE' || t.estado === 'EN_CURSO',
                }));
                setTurnos(formattedTurnos);
            }

            if (bloqueosRes.ok) {
                const bloqueosData = await bloqueosRes.json();
                const formattedBloqueos = bloqueosData.map((b: any, idx: number) => ({
                    id: `bloqueo-${idx}`,
                    title: b.tipo === 'DESCANSO' ? 'Descanso' : b.tipo === 'AUSENCIA' ? `Ausencia${b.motivo ? ': ' + b.motivo : ''}` : 'No trabaja',
                    start: new Date(b.inicio),
                    end: new Date(b.fin),
                    resourceId: b.barberoId,
                    isBackgroundEvent: true,
                }));
                setBloqueos(formattedBloqueos);
            }
        } catch (err) {
            console.error('Error fetching agenda data', err);
            toast.error('Error al cargar la agenda');
        } finally {
            setLoading(false);
        }
    }, [token, date, view, getDateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Recursos (columnas por barbero) — solo en vista diaria
    const resourceMap = useMemo(() =>
        barberos
            .filter(b => b.BarberoProfile?.id)
            .map(b => ({
                resourceId: b.BarberoProfile.id,
                resourceTitle: b.nombre,
            })),
        [barberos]
    );

    // Estilo por estado del evento
    const eventPropGetter = useCallback((event: any) => {
        if (event.isBackgroundEvent) return {};

        const className = STATE_CLASSES[event.estado] || STATE_CLASSES['PENDIENTE'];
        return {
            className,
            style: {
                // Ya no necesitamos estilos inline complejos, se manejan por clase
            },
        };
    }, []);

    // Click en slot vacío → Nuevo Turno
    const handleSelectSlot = useCallback((slotInfo: any) => {
        setPreselectedBarberoId(slotInfo.resourceId || undefined);
        setPreselectedStart(slotInfo.start);
        setNuevoTurnoOpen(true);
    }, []);

    // Click en evento → Detalle
    const handleSelectEvent = useCallback((event: any) => {
        if (event.isBackgroundEvent) return;
        setDetailTurno(event);
    }, []);

    // Drag & Drop
    const handleEventDrop = useCallback(async ({ event, start, end, resourceId }: any) => {
        if (event.isBackgroundEvent) return;
        if (event.estado === 'FINALIZADO' || event.estado === 'CANCELADO' || event.estado === 'NO_ASISTIO') {
            toast.error('No se puede mover un turno finalizado o cancelado');
            return;
        }

        // Optimistic update
        const originalTurnos = [...turnos];
        setTurnos(prev => prev.map(t =>
            t.id === event.id
                ? { ...t, start, end, resourceId: resourceId || t.resourceId }
                : t
        ));

        try {
            const body: any = {
                fechaHoraInicio: start.toISOString(), // date-fns start object to UTC ISO
            };
            if (resourceId && resourceId !== event.resourceId) {
                body.barberoId = resourceId;
            }

            const res = await fetch(`${API}/turnos/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al mover turno');
            }

            toast.success('Turno movido exitosamente');
            fetchData(); // Refresh desde server
        } catch (err: any) {
            toast.error(err.message);
            setTurnos(originalTurnos); // Revertir
        }
    }, [turnos, token, fetchData]);

    // Resize
    const handleEventResize = useCallback(async ({ event, start, end }: any) => {
        // No permitimos resize ya que la duración la determina el servicio
        toast.error('La duración del turno se calcula según el servicio');
        fetchData();
    }, [fetchData]);

    // Combinar turnos y bloqueos
    const allEvents = useMemo(() => [...turnos, ...bloqueos], [turnos, bloqueos]);

    // Drag constraints
    const draggableAccessor = useCallback((event: any) => {
        return event.isDraggable === true;
    }, []);

    if (loading && turnos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 font-semibold animate-pulse">Cargando Agenda...</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Agenda</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {barberos.length} barbero{barberos.length !== 1 ? 's' : ''} activa{barberos.length !== 1 ? 's' : ''} · {turnos.length} turno{turnos.length !== 1 ? 's' : ''} agendado{turnos.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={fetchData}
                        className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
                        title="Actualizar agenda"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <Button
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => {
                            setPreselectedBarberoId(undefined);
                            setPreselectedStart(undefined);
                            setNuevoTurnoOpen(true);
                        }}
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white border-none rounded-xl py-2.5 px-6 font-medium"
                    >
                        Nuevo Turno
                    </Button>
                </div>
            </div>

            {/* Calendar */}
            <div className="flex-1 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-2 sm:p-4 overflow-hidden flex flex-col">
                <DnDCalendar
                    localizer={localizer}
                    events={allEvents}
                    defaultView={Views.DAY}
                    views={['day', 'week', 'month']}
                    view={view}
                    onView={(newView: View) => setView(newView)}
                    date={date}
                    onNavigate={(newDate: Date) => setDate(newDate)}
                    resources={view === Views.DAY ? resourceMap : undefined}
                    resourceIdAccessor={(r: any) => r.resourceId}
                    resourceTitleAccessor={(r: any) => r.resourceTitle}
                    step={15}
                    timeslots={4}
                    min={new Date(0, 0, 0, 7, 0, 0)}
                    max={new Date(0, 0, 0, 22, 0, 0)}
                    culture="es"
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventResize}
                    draggableAccessor={draggableAccessor}
                    resizable={false}
                    messages={{
                        today: 'Hoy',
                        previous: 'Atrás',
                        next: 'Siguiente',
                        month: 'Mes',
                        week: 'Semana',
                        day: 'Día',
                        agenda: 'Lista',
                        date: 'Fecha',
                        time: 'Hora',
                        event: 'Turno',
                        noEventsInRange: 'No hay turnos en este rango.',
                        showMore: (total: number) => `+${total} más`,
                    }}
                    eventPropGetter={eventPropGetter}
                    className="flex-1 font-sans"
                />
            </div>

            {/* Leyenda de colores */}
            <div className="flex items-center gap-6 mt-6 px-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-900 dark:bg-white"></div>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Agendado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-500 font-semibold uppercase tracking-wider">Finalizado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)' }}></div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Bloqueo / Descanso</span>
                </div>
            </div>

            {/* Modals */}
            <NuevoTurnoModal
                isOpen={nuevoTurnoOpen}
                onClose={() => setNuevoTurnoOpen(false)}
                onSuccess={fetchData}
                preselectedBarberoId={preselectedBarberoId}
                preselectedStart={preselectedStart}
                barberos={barberos}
            />

            <TurnoDetailModal
                isOpen={!!detailTurno}
                onClose={() => setDetailTurno(null)}
                turno={detailTurno}
                onSuccess={() => { setDetailTurno(null); fetchData(); }}
                onCheckout={(turno) => setCheckoutTurno(turno)}
            />

            <CheckoutModal
                isOpen={!!checkoutTurno}
                onClose={() => setCheckoutTurno(null)}
                turno={checkoutTurno}
                onSuccess={() => { setCheckoutTurno(null); fetchData(); }}
            />
        </div>
    );
}
