'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { DollarSign, Calendar, TrendingUp, Clock, User, Scissors } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────
interface DashboardData {
    ingresosHoy: number;
    turnosHoy: { total: number; pendientes: number; finalizados: number; cancelados: number };
    ticketPromedioMes: number;
    staffRendimiento: { nombre: string; clientes: number; ingresos: number }[];
    proximosTurnos: { id: string; hora: string; cliente: string; barbero: string; servicio: string; duracion: number }[];
    chartIngresos7Dias: { dia: string; ingresos: number }[];
}

// ── Skeleton Components ──────────────────────────────────────────────────
function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
            </div>
            <div className="h-9 w-32 bg-slate-100 rounded mb-2" />
            <div className="h-3 w-20 bg-slate-50 rounded" />
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-pulse">
            <div className="h-5 w-40 bg-slate-100 rounded mb-6" />
            <div className="flex items-end gap-3 h-52">
                {[40, 65, 50, 80, 45, 70, 55].map((h, i) => (
                    <div key={i} className="flex-1 bg-slate-100 rounded-t" style={{ height: `${h}%` }} />
                ))}
            </div>
        </div>
    );
}

function ListSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-pulse">
            <div className="h-5 w-36 bg-slate-100 rounded mb-5" />
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100" />
                        <div className="flex-1">
                            <div className="h-4 w-28 bg-slate-100 rounded mb-1.5" />
                            <div className="h-3 w-20 bg-slate-50 rounded" />
                        </div>
                        <div className="h-4 w-12 bg-slate-100 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-pulse">
            <div className="h-5 w-48 bg-slate-100 rounded mb-5" />
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50">
                        <div className="w-8 h-8 rounded-full bg-slate-100" />
                        <div className="flex-1 h-4 bg-slate-100 rounded" />
                        <div className="w-16 h-4 bg-slate-100 rounded" />
                        <div className="w-20 h-4 bg-slate-100 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);
}

function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDayLabel(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00');
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias[date.getDay()] || dateStr;
}

// ── Custom Tooltip for Chart ─────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
            <p className="font-medium">{formatDayLabel(label)}</p>
            <p className="text-blue-300">{formatCurrency(payload[0].value)}</p>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────
export default function DashboardIndex() {
    const { token } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const res = await fetch('http://localhost:3001/api/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Error al obtener datos');
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [token]);

    // ── Error State ──────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                <p className="text-red-600 font-medium">No se pudieron cargar los datos del dashboard</p>
                <p className="text-red-400 text-sm mt-1">{error}</p>
            </div>
        );
    }

    // ── Loading State ────────────────────────────────────────────────────
    if (loading || !data) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2"><ChartSkeleton /></div>
                    <ListSkeleton />
                </div>
                <TableSkeleton />
            </div>
        );
    }

    // ── KPI Cards Config ─────────────────────────────────────────────────
    const kpis = [
        {
            label: 'Ingresos de Hoy',
            value: formatCurrency(data.ingresosHoy),
            icon: DollarSign,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            sub: 'Recaudación del día'
        },
        {
            label: 'Turnos de Hoy',
            value: data.turnosHoy.total.toString(),
            icon: Calendar,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            sub: `${data.turnosHoy.pendientes} pend · ${data.turnosHoy.finalizados} fin · ${data.turnosHoy.cancelados} canc`
        },
        {
            label: 'Ticket Promedio',
            value: formatCurrency(data.ticketPromedioMes),
            icon: TrendingUp,
            iconBg: 'bg-violet-50',
            iconColor: 'text-violet-600',
            sub: 'Promedio del mes'
        }
    ];

    return (
        <div className="space-y-6">
            {/* ── KPI Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {kpis.map((kpi, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                                <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
                            </div>
                            <span className="text-slate-500 text-sm font-medium">{kpi.label}</span>
                        </div>
                        <p className="text-slate-900 font-semibold text-3xl tracking-tight">{kpi.value}</p>
                        <p className="text-slate-400 text-xs mt-1.5">{kpi.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Chart + Próximos Turnos ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-slate-900 font-semibold text-base mb-5">Ingresos — Últimos 7 días</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.chartIngresos7Dias} barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="dia"
                                    tickFormatter={formatDayLabel}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={v => `$${v}`}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={60}
                                />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="ingresos" fill="#2563eb" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Próximos Turnos */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-slate-900 font-semibold text-base mb-5 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        Próximos Turnos
                    </h3>
                    {data.proximosTurnos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Calendar className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-slate-400 text-sm">No hay turnos pendientes</p>
                            <p className="text-slate-300 text-xs mt-0.5">para el resto del día</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {data.proximosTurnos.map((turno, i) => (
                                <div key={turno.id}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <span className="text-blue-600 font-semibold text-xs">{formatTime(turno.hora)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-900 text-sm font-medium truncate">{turno.cliente}</p>
                                        <p className="text-slate-400 text-xs truncate">
                                            {turno.servicio} · {turno.duracion} min
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-slate-500 text-xs font-medium truncate max-w-[80px]">{turno.barbero}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Staff Performance ──────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-slate-900 font-semibold text-base mb-5 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-slate-400" />
                    Rendimiento del Staff — Esta Semana
                </h3>
                {data.staffRendimiento.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <User className="w-10 h-10 text-slate-200 mb-3" />
                        <p className="text-slate-400 text-sm">Sin datos de rendimiento</p>
                        <p className="text-slate-300 text-xs mt-0.5">No hay turnos finalizados esta semana</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left text-slate-400 text-xs font-medium uppercase tracking-wider py-3 pr-4">#</th>
                                    <th className="text-left text-slate-400 text-xs font-medium uppercase tracking-wider py-3 pr-4">Barbero</th>
                                    <th className="text-center text-slate-400 text-xs font-medium uppercase tracking-wider py-3 px-4">Clientes</th>
                                    <th className="text-right text-slate-400 text-xs font-medium uppercase tracking-wider py-3 pl-4">Ingresos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.staffRendimiento.map((staff, i) => (
                                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3.5 pr-4">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                                ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-500' : i === 2 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}
                                            `}>
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td className="py-3.5 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <span className="text-slate-900 text-sm font-medium">{staff.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                                {staff.clientes}
                                            </span>
                                        </td>
                                        <td className="py-3.5 pl-4 text-right">
                                            <span className="text-slate-900 text-sm font-semibold">{formatCurrency(staff.ingresos)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
