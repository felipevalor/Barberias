'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BarChart3, TrendingUp, Scissors, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ReportesPage() {
    const { token, user } = useAuth();
    const [rendimiento, setRendimiento] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtros de fecha base (Por defecto este mes)
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });

    const fetchRendimiento = async () => {
        try {
            setLoading(true);
            const startIso = dateRange.start.toISOString();
            const endIso = dateRange.end.toISOString();

            const res = await fetch(`http://localhost:3001/api/reportes/rendimiento?start=${startIso}&end=${endIso}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setRendimiento(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchRendimiento();
    }, [token, dateRange]);

    const totalIngresos = rendimiento.reduce((sum, item) => sum + item.ingresosGenerados, 0);
    const totalServicios = rendimiento.reduce((sum, item) => sum + item.serviciosRealizados, 0);

    const setMesAnterior = () => {
        const prevMonthStart = startOfMonth(subMonths(new Date(), 1));
        const prevMonthEnd = endOfMonth(subMonths(new Date(), 1));
        setDateRange({ start: prevMonthStart, end: prevMonthEnd });
    };

    const setMesActual = () => {
        setDateRange({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
    };

    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
        return <div className="p-8 text-center text-red-600">Acceso denegado. Solo administradores pueden ver los reportes.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <BarChart3 className="w-6 h-6 mr-2 text-purple-600" />
                        Reportes y Analíticas
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Rendimiento del equipo del <strong className="text-gray-700 dark:text-gray-300">{format(dateRange.start, "d 'de' MMMM", { locale: es })}</strong> al <strong className="text-gray-700 dark:text-gray-300">{format(dateRange.end, "d 'de' MMMM, yyyy", { locale: es })}</strong>
                    </p>
                </div>

                <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button
                        onClick={setMesAnterior}
                        className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition text-gray-600 dark:text-gray-300"
                    >
                        Mes Anterior
                    </button>
                    <button
                        onClick={setMesActual}
                        className="px-3 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                    >
                        Este Mes
                    </button>
                </div>
            </div>

            {/* Tarjetas de Resumen Global */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center">
                    <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-4">
                        <DollarSign className="w-7 h-7 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos Totales (Servicios)</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">${totalIngresos.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center">
                    <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4">
                        <Scissors className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Servicios Realizados</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{totalServicios}</p>
                    </div>
                </div>
            </div>

            {/* Tabla de Rendimiento por Barbero */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-3 text-purple-600" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Rendimiento por Barbero</h3>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">Calculando analíticas...</div>
                ) : rendimiento.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <CalendarIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No hay turnos finalizados en el periodo seleccionado.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Barbero</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Servicios Completados</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ingresos Generados</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">% del Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {rendimiento.map((item, idx) => {
                                    const porcentaje = totalIngresos > 0 ? ((item.ingresosGenerados / totalIngresos) * 100).toFixed(1) : 0;
                                    return (
                                        <tr key={item.barberoId} className={idx === 0 ? 'bg-purple-50/30 dark:bg-purple-900/10' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                                                        {item.nombre.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="ml-3">
                                                        <span className="font-bold text-gray-900 dark:text-white">
                                                            {item.nombre}
                                                            {idx === 0 && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">TOP 1</span>}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                                                {item.serviciosRealizados}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-black text-gray-900 dark:text-white">
                                                ${item.ingresosGenerados.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center">
                                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400 w-12 text-right mr-2">{porcentaje}%</span>
                                                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${porcentaje}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
