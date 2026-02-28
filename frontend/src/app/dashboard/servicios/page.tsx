'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { PlusCircle, Power, Edit, Scissors, Clock, DollarSign, Users, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ServiciosPage() {
    const [servicios, setServicios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();

    const fetchServicios = async () => {
        try {
            const res = await fetch(`${API}/servicios`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar servicios');
            const data = await res.json();
            setServicios(data);
        } catch (err: any) {
            setError(err.message);
            toast.error('Error al cargar catálogo de servicios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchServicios();
    }, [token]);

    const toggleEstado = async (id: string, currentEstado: boolean) => {
        try {
            const res = await fetch(`${API}/servicios/${id}/estado`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ activo: !currentEstado })
            });
            if (!res.ok) throw new Error('Error al actualizar estado');

            toast.success(currentEstado ? 'Servicio desactivado' : 'Servicio activado');
            fetchServicios();
        } catch (err: any) {
            toast.error(err.message || 'Error al actualizar el servicio');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Cargando catálogo...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
                        <Scissors className="w-7 h-7 mr-3 text-emerald-600" />
                        Catálogo de Servicios
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Gestiona los servicios que ofreces y sus precios.</p>
                </div>
                <Link href="/dashboard/servicios/new">
                    <Button
                        leftIcon={<PlusCircle className="w-4 h-4" />}
                        className="shadow-sm hover:shadow-md transition-all h-11 bg-emerald-600 hover:bg-emerald-700"
                    >
                        Añadir Servicio
                    </Button>
                </Link>
            </div>

            {error ? (
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center text-red-700">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    <p className="font-semibold">{error}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servicios.length === 0 ? (
                        <div className="col-span-full bg-white border border-slate-200 border-dashed rounded-3xl p-12 text-center">
                            <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Scissors className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Catálogo vacío</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Comienza añadiendo los servicios que ofrece tu barbería a los clientes.</p>
                            <Link href="/dashboard/servicios/new">
                                <Button className="h-10 text-xs bg-emerald-600 hover:bg-emerald-700">Crear Primer Servicio</Button>
                            </Link>
                        </div>
                    ) : (
                        servicios.map((servicio) => (
                            <div key={servicio.id} className={`bg-white border ${servicio.activo ? 'border-slate-200 hover:border-emerald-300 hover:shadow-md' : 'border-slate-200 opacity-75 grayscale-[0.5]'} rounded-2xl p-6 shadow-sm transition-all group relative flex flex-col h-full`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-xl font-black shadow-inner ${servicio.activo ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                        {servicio.nombre.charAt(0)}
                                    </div>
                                    <div className="flex bg-white shadow-sm border border-slate-100 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-50 transition-colors" title="Editar">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => toggleEstado(servicio.id, servicio.activo)}
                                            className={`p-1.5 rounded-md hover:bg-slate-50 transition-colors ${servicio.activo ? 'text-slate-400 hover:text-orange-600' : 'text-orange-500 hover:text-emerald-600'}`}
                                            title={servicio.activo ? 'Desactivar Servicio' : 'Activar Servicio'}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center">
                                        <h3 className={`text-lg font-black truncate mr-2 ${servicio.activo ? 'text-slate-900' : 'text-slate-500'}`}>
                                            {servicio.nombre}
                                        </h3>
                                        {!servicio.activo && (
                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Inactivo</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                        {servicio.descripcion || 'Sin descripción detallada.'}
                                    </p>
                                </div>

                                <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center divide-x divide-slate-100">
                                    <div className="flex flex-col items-center justify-center">
                                        <DollarSign className={`w-4 h-4 mb-1 ${servicio.activo ? 'text-emerald-500' : 'text-slate-400'}`} />
                                        <span className="text-sm font-black text-slate-900">${servicio.precio}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center">
                                        <Clock className="w-4 h-4 mb-1 text-blue-500" />
                                        <span className="text-sm font-bold text-slate-700">{servicio.duracionMinutos}m</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center">
                                        <Users className="w-4 h-4 mb-1 text-indigo-500" />
                                        <span className="text-sm font-bold text-slate-700">{servicio.barberos?.length || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
