'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, TrendingDown, DollarSign, List, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';

export default function CajaPage() {
    const { token, user } = useAuth();
    const [flujo, setFlujo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchCaja = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/pos/flujo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setFlujo(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchCaja();
    }, [token]);

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
        return <div className="p-8 text-center text-red-500">No tienes permisos para ver el Flujo de Caja.</div>;
    }

    if (loading) return <div className="p-8">Cargando métricas...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Flujo de Caja</h2>
                    <p className="text-gray-500">Resumen financiero del día de hoy: {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</p>
                </div>
                {/* Aquí podríamos poner un selector de fechas en el futuro para ver meses/semanas */}
            </div>

            {/* Tarjetas de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Balance */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl mr-4">
                        <DollarSign className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Balance del Día</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">${flujo?.resumen?.balance || 0}</h3>
                    </div>
                </div>

                {/* Ingresos */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-green-100 dark:border-green-900/30 p-6 flex items-center">
                    <div className="p-4 bg-green-100 dark:bg-green-900/40 text-green-600 rounded-xl mr-4">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Ingresos</p>
                        <h3 className="text-3xl font-black text-green-600 dark:text-green-400">${flujo?.resumen?.totalIngresos || 0}</h3>
                    </div>
                </div>

                {/* Egresos */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 p-6 flex items-center">
                    <div className="p-4 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-xl mr-4">
                        <TrendingDown className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Egresos</p>
                        <h3 className="text-3xl font-black text-red-600 dark:text-red-400">${flujo?.resumen?.totalEgresos || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Lista de Transacciones */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-8">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <List className="w-5 h-5 mr-2 text-gray-500" />
                        Movimientos Recientes
                    </h3>
                </div>

                {flujo?.transacciones?.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">No hay movimientos registrados hoy.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/30">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalle</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-750">
                                {flujo?.transacciones?.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {format(new Date(t.fecha), 'HH:mm')} hs
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {t.tipo === 'INGRESO' ? (
                                                    <ArrowUpCircle className="w-5 h-5 text-green-500 mr-3" />
                                                ) : (
                                                    <ArrowDownCircle className="w-5 h-5 text-red-500 mr-3" />
                                                )}
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{t.descripcion}</div>
                                                    {t.turno?.cliente && (
                                                        <div className="text-xs text-gray-500">Cliente: {t.turno.cliente.nombre}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {t.metodoPago?.nombre}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${t.tipo === 'INGRESO' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {t.tipo === 'INGRESO' ? '+' : '-'}${t.monto}
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
