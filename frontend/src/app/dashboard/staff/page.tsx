'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { PlusCircle, CalendarClock, Trash2, Edit } from 'lucide-react';

export default function StaffPage() {
    const [barberos, setBarberos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        const fetchBarberos = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/staff', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Error al cargar staff');
                const data = await res.json();
                setBarberos(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchBarberos();
    }, [token]);

    if (loading) return <div>Cargando staff...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Equipo de Barberos</h2>
                <Link
                    href="/dashboard/staff/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Añadir Barbero
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {barberos.length === 0 ? (
                        <li className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            Aún no tienes barberos registrados en tu equipo.
                        </li>
                    ) : (
                        barberos.map((barbero) => (
                            <li key={barbero.id} className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center rounded-full text-xl font-bold mr-4">
                                        {barbero.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{barbero.nombre}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {barbero.BarberoProfile?.especialidad || 'Especialidad no definida'} • {barbero.BarberoProfile?.telefono || 'Sin teléfono'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <Link
                                        href={`/dashboard/staff/${barbero.BarberoProfile?.id}/horarios`}
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        title="Configurar Horarios"
                                    >
                                        <CalendarClock className="w-5 h-5" />
                                    </Link>
                                    <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors" title="Editar Perfil">
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Dar de baja">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
