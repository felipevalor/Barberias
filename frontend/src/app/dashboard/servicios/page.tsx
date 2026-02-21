'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { PlusCircle, Power, Trash2, Edit } from 'lucide-react';

export default function ServiciosPage() {
    const [servicios, setServicios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();

    const fetchServicios = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/servicios', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar servicios');
            const data = await res.json();
            setServicios(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchServicios();
    }, [token]);

    const toggleEstado = async (id: string, currentEstado: boolean) => {
        try {
            await fetch(`http://localhost:3001/api/servicios/${id}/estado`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ activo: !currentEstado })
            });
            fetchServicios();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Cargando servicios...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Catálogo de Servicios</h2>
                <Link
                    href="/dashboard/servicios/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Añadir Servicio
                </Link>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {servicios.length === 0 ? (
                        <li className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            No tienes servicios creados en tu catálogo.
                        </li>
                    ) : (
                        servicios.map((servicio) => (
                            <li key={servicio.id} className={`px-6 py-5 flex items-center justify-between transition-colors ${servicio.activo ? 'hover:bg-gray-50 dark:hover:bg-gray-750' : 'bg-gray-50 dark:bg-gray-900 opacity-60'}`}>
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center rounded-full text-xl font-bold mr-4">
                                        {servicio.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                            {servicio.nombre}
                                            {!servicio.activo && <span className="ml-3 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 px-2 py-1 rounded-full">Inactivo</span>}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {servicio.descripcion || 'Sin descripción'}
                                        </p>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1 flex space-x-4">
                                            <span>Precio: <strong className="text-gray-900 dark:text-white">${servicio.precio}</strong></span>
                                            <span>Duración: {servicio.duracionMinutos} min</span>
                                            <span>Barberos habilitados: {servicio.barberos?.length || 0}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => toggleEstado(servicio.id, servicio.activo)}
                                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                                        title={servicio.activo ? 'Desactivar Servicio' : 'Activar Servicio'}
                                    >
                                        <Power className={`w-5 h-5 ${servicio.activo ? '' : 'text-orange-500'}`} />
                                    </button>
                                    <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Editar">
                                        <Edit className="w-5 h-5" />
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
