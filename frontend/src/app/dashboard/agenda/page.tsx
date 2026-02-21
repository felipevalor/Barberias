'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { startOfDay } from 'date-fns/startOfDay';
import { endOfDay } from 'date-fns/endOfDay';
import { addDays } from 'date-fns/addDays';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './agenda-calendar.css';
import toast from 'react-hot-toast';
import { Plus, RefreshCcw } from 'lucide-react';

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
const STATE_COLORS: Record<string, string> = {
    'PENDIENTE': '#3b82f6',
    'EN_CURSO': '#f59e0b',
    'FINALIZADO': '#10b981',
    'CANCELADO': '#ef4444',
    'NO_ASISTIO': '#6b7280',
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

        const bg = STATE_COLORS[event.estado] || STATE_COLORS['PENDIENTE'];
        return {
            style: {
                backgroundColor: bg,
                borderRadius: '6px',
                border: 'none',
                color: 'white',
                opacity: event.estado === 'CANCELADO' || event.estado === 'NO_ASISTIO' ? 0.5 : 0.9,
                cursor: 'pointer',
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
                fechaHoraInicio: start.toISOString(),
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
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando Agenda...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda General</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {barberos.length} barbero{barberos.length !== 1 ? 's' : ''} · {turnos.length} turno{turnos.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        title="Refrescar"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold text-sm transition-all shadow-sm hover:shadow-md"
                        onClick={() => {
                            setPreselectedBarberoId(undefined);
                            setPreselectedStart(undefined);
                            setNuevoTurnoOpen(true);
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Turno
                    </button>
                </div>
            </div>

            {/* Calendar */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 overflow-hidden">
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
                    className="font-sans"
                />
            </div>

            {/* Leyenda de colores */}
            <div className="flex items-center gap-4 mt-3 px-1 flex-wrap">
                {Object.entries(STATE_COLORS).map(([key, color]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {key === 'PENDIENTE' ? 'Pendiente' : key === 'EN_CURSO' ? 'En Curso' : key === 'FINALIZADO' ? 'Finalizado' : key === 'CANCELADO' ? 'Cancelado' : 'No Asistió'}
                        </span>
                    </div>
                ))}
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded border border-gray-400 bg-gray-200 dark:bg-gray-600" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)' }}></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Bloqueo/Descanso</span>
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
