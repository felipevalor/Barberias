'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { PlusCircle, CalendarClock, Trash2, Edit, Scissors, Phone, BadgeCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function StaffPage() {
    const [barberos, setBarberos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState<{ id: string, name: string } | null>(null);
    const { token } = useAuth();

    const fetchBarberos = async () => {
        try {
            const res = await fetch(`${API}/staff`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar staff');
            const data = await res.json();
            setBarberos(data);
        } catch (err: any) {
            setError(err.message);
            toast.error('Error al cargar la lista de barberos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchBarberos();
    }, [token]);

    const handleDeleteClick = (id: string, name: string) => {
        setStaffToDelete({ id, name });
        setIsConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!staffToDelete) return;

        const { id: profileId, name } = staffToDelete;
        setIsConfirmOpen(false);
        setDeletingId(profileId);
        try {
            const res = await fetch(`${API}/staff/${profileId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error al dar de baja');

            toast.success(`${name} ha sido dado de baja correctamente`);
            fetchBarberos();
        } catch (err: any) {
            toast.error(err.message || 'Error al procesar la baja');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Cargando equipo...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
                        <Scissors className="w-7 h-7 mr-3 text-blue-600" />
                        Gestionar Staff
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Administra tu equipo de trabajo y sus horarios.</p>
                </div>
                <Link href="/dashboard/staff/new">
                    <Button
                        leftIcon={<PlusCircle className="w-4 h-4" />}
                        className="shadow-sm hover:shadow-md transition-all h-11"
                    >
                        Añadir Barbero
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
                    {barberos.length === 0 ? (
                        <div className="col-span-full bg-white border border-slate-200 border-dashed rounded-3xl p-12 text-center">
                            <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Scissors className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Tu equipo está vacío</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Comienza añadiendo los profesionales de tu barbería para gestionar su agenda.</p>
                            <Link href="/dashboard/staff/new">
                                <Button variant="secondary" className="h-10 text-xs">Crear Primer Barbero</Button>
                            </Link>
                        </div>
                    ) : (
                        barberos.map((barbero) => (
                            <div key={barbero.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative">
                                <div className="flex items-start justify-between">
                                    <div className="w-14 h-14 bg-slate-50 text-slate-900 border border-slate-200 flex items-center justify-center rounded-xl text-xl font-black shadow-inner">
                                        {barbero.nombre.charAt(0)}
                                    </div>
                                    <div className="flex bg-white shadow-sm border border-slate-100 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/dashboard/staff/${barbero.BarberoProfile?.id}/horarios`}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-50"
                                            title="Horarios"
                                        >
                                            <CalendarClock className="w-4 h-4" />
                                        </Link>
                                        <button className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-slate-50" title="Editar">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(barbero.BarberoProfile?.id, barbero.nombre)}
                                            disabled={deletingId === barbero.BarberoProfile?.id}
                                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-50"
                                            title="Baja"
                                        >
                                            {deletingId === barbero.BarberoProfile?.id ? (
                                                <div className="w-4 h-4 border-2 border-slate-200 border-t-red-500 rounded-full animate-spin"></div>
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <div className="flex items-center">
                                        <h3 className="text-lg font-black text-slate-900 truncate mr-2">{barbero.nombre}</h3>
                                        <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {barbero.BarberoProfile?.especialidad || 'Staff General'}
                                    </p>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs font-semibold">
                                    <div className="flex items-center">
                                        <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-300" />
                                        {barbero.BarberoProfile?.telefono || 'No regist.'}
                                    </div>
                                    <Link
                                        href={`/dashboard/staff/${barbero.BarberoProfile?.id}/horarios`}
                                        className="text-blue-600 hover:underline flex items-center"
                                    >
                                        Ver Turnos
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="¿Dar de baja?"
                message={`¿Estás seguro de que deseas dar de baja a ${staffToDelete?.name}? Esta acción no eliminará sus turnos pasados.`}
                confirmText="Dar de Baja"
                type="danger"
            />
        </div>
    );
}
