'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Clock, User, Scissors, ArrowRight, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface TurnoDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    turno: any;
    onSuccess: () => void;
    onCheckout: (turno: any) => void; // Abre el CheckoutModal
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const ESTADO_CONFIG: Record<string, { label: string, color: string, bg: string, border: string }> = {
    'PENDIENTE': { label: 'Pendiente', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' },
    'EN_CURSO': { label: 'En Curso', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800' },
    'FINALIZADO': { label: 'Finalizado', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800' },
    'CANCELADO': { label: 'Cancelado', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800' },
    'NO_ASISTIO': { label: 'No Asistió', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-900/30', border: 'border-gray-200 dark:border-gray-700' },
};

export default function TurnoDetailModal({ isOpen, onClose, turno, onSuccess, onCheckout }: TurnoDetailModalProps) {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);

    if (!isOpen || !turno) return null;

    const estado = turno.estado || 'PENDIENTE';
    const config = ESTADO_CONFIG[estado] || ESTADO_CONFIG['PENDIENTE'];

    const cambiarEstado = async (nuevoEstado: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/turnos/${turno.id}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al cambiar estado');
            }

            const updatedTurno = await res.json();

            if (nuevoEstado === 'FINALIZADO') {
                toast.success('Turno finalizado — Abriendo cobro...');
                onClose();
                // Pasar turno completo al checkout
                onCheckout(updatedTurno);
            } else if (nuevoEstado === 'CANCELADO') {
                toast.success('Turno cancelado — Horario liberado');
                onClose();
                onSuccess();
            } else {
                toast.success(`Estado cambiado a ${ESTADO_CONFIG[nuevoEstado]?.label || nuevoEstado}`);
                onSuccess();
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
            setConfirmCancel(false);
        }
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const isFinal = estado === 'FINALIZADO' || estado === 'CANCELADO' || estado === 'NO_ASISTIO';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detalle del Turno</h3>
                        <div className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${config.bg} ${config.color} ${config.border} border`}>
                            {config.label}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Info Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <User className="w-3 h-3 mr-1" /> Cliente
                            </div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white">{turno.cliente?.nombre || turno.title?.split(' - ')[0] || '—'}</p>
                            {turno.cliente?.telefono && <p className="text-xs text-gray-500 mt-0.5">{turno.cliente.telefono}</p>}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <Scissors className="w-3 h-3 mr-1" /> Servicio
                            </div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white">{turno.servicio?.nombre || turno.title?.split(' - ')[1] || '—'}</p>
                            {turno.servicio?.precio && <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">${turno.servicio.precio}</p>}
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <Clock className="w-3 h-3 mr-1" /> Horario
                        </div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">
                            {formatDate(turno.fechaHoraInicio || turno.start)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                            {formatTime(turno.fechaHoraInicio || turno.start)} — {formatTime(turno.fechaHoraFin || turno.end)}
                        </p>
                    </div>

                    {turno.barbero?.user?.nombre && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <Scissors className="w-3 h-3 mr-1" /> Barbero
                            </div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white">{turno.barbero.user.nombre}</p>
                        </div>
                    )}

                    {/* Acciones de Estado */}
                    {!isFinal && (
                        <div className="space-y-2 pt-2">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cambiar Estado</p>

                            <div className="grid grid-cols-2 gap-2">
                                {estado === 'PENDIENTE' && (
                                    <button
                                        onClick={() => cambiarEstado('EN_CURSO')}
                                        disabled={loading}
                                        className="flex items-center justify-center px-3 py-2.5 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 disabled:opacity-50 transition shadow-sm"
                                    >
                                        <ArrowRight className="w-4 h-4 mr-1.5" /> En Curso
                                    </button>
                                )}

                                {(estado === 'PENDIENTE' || estado === 'EN_CURSO') && (
                                    <button
                                        onClick={() => cambiarEstado('FINALIZADO')}
                                        disabled={loading}
                                        className="flex items-center justify-center px-3 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
                                    >
                                        <ArrowRight className="w-4 h-4 mr-1.5" /> Finalizar & Cobrar
                                    </button>
                                )}

                                <button
                                    onClick={() => cambiarEstado('NO_ASISTIO')}
                                    disabled={loading}
                                    className="flex items-center justify-center px-3 py-2.5 bg-gray-500 text-white rounded-xl font-semibold text-sm hover:bg-gray-600 disabled:opacity-50 transition shadow-sm"
                                >
                                    No Asistió
                                </button>

                                {!confirmCancel ? (
                                    <button
                                        onClick={() => setConfirmCancel(true)}
                                        disabled={loading}
                                        className="flex items-center justify-center px-3 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition"
                                    >
                                        <AlertTriangle className="w-4 h-4 mr-1.5" /> Cancelar
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => cambiarEstado('CANCELADO')}
                                        disabled={loading}
                                        className="flex items-center justify-center px-3 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50 transition shadow-sm animate-pulse"
                                    >
                                        ¿Confirmar cancelar?
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
