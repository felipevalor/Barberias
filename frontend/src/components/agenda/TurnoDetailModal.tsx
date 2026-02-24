'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Clock, User, Scissors, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';

interface TurnoDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    turno: any;
    onSuccess: () => void;
    onCheckout: (turno: any) => void; // Abre el CheckoutModal
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const ESTADO_CONFIG: Record<string, { label: string, color: string, bg: string, border: string, icon: any }> = {
    'PENDIENTE': { label: 'Pendiente', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', icon: Clock },
    'EN_CURSO': { label: 'En Curso', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', icon: ArrowRight },
    'FINALIZADO': { label: 'Finalizado', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800', icon: CheckCircle2 },
    'CANCELADO': { label: 'Cancelado', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', icon: AlertTriangle },
    'NO_ASISTIO': { label: 'No Asistió', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-900/30', border: 'border-gray-200 dark:border-gray-700', icon: User },
};

export default function TurnoDetailModal({ isOpen, onClose, turno, onSuccess, onCheckout }: TurnoDetailModalProps) {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);

    if (!isOpen || !turno) return null;

    const estado = turno.estado || 'PENDIENTE';
    const config = ESTADO_CONFIG[estado] || ESTADO_CONFIG['PENDIENTE'];
    const StatusIcon = config.icon;

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
                onCheckout(updatedTurno);
            } else if (nuevoEstado === 'CANCELADO') {
                toast.success('Turno anulado — El horario se ha liberado');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="detail-modal-title">
            <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 id="detail-modal-title" className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Detalle del Turno</h3>
                        <div className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${config.bg} ${config.color} ${config.border} border`}>
                            <StatusIcon className="w-3 h-3 mr-1.5" />
                            {config.label}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition p-1" aria-label="Cerrar modal">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                    {/* Info Section */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 transition-colors hover:bg-white dark:hover:bg-gray-900">
                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Cliente</span>
                                <p className="font-bold text-gray-900 dark:text-white truncate">{turno.cliente?.nombre || turno.title?.split(' - ')[0] || '—'}</p>
                                {turno.cliente?.telefono && (
                                    <p className="text-xs text-gray-500 font-medium mt-1 truncate">{turno.cliente.telefono}</p>
                                )}
                            </div>
                            <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 transition-colors hover:bg-white dark:hover:bg-gray-900">
                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Servicio</span>
                                <p className="font-bold text-gray-900 dark:text-white truncate">{turno.servicio?.nombre || turno.title?.split(' - ')[1] || '—'}</p>
                                {turno.servicio?.precio && (
                                    <p className="text-xs font-black text-blue-600 dark:text-blue-400 mt-1">${turno.servicio.precio}</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Fecha y Horario</span>
                            <p className="font-bold text-gray-900 dark:text-white capitalize">
                                {formatDate(turno.fechaHoraInicio || turno.start)}
                            </p>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1.5 font-semibold">
                                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                {formatTime(turno.fechaHoraInicio || turno.start)} — {formatTime(turno.fechaHoraFin || turno.end)}
                            </div>
                        </div>

                        {turno.barbero?.user?.nombre && (
                            <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Atendido por</span>
                                <div className="flex items-center">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-[10px] font-black mr-2">
                                        {turno.barbero.user.nombre.charAt(0)}
                                    </div>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{turno.barbero.user.nombre}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    {!isFinal && (
                        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Gestionar Turno</h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {estado === 'PENDIENTE' && (
                                    <Button
                                        onClick={() => cambiarEstado('EN_CURSO')}
                                        isLoading={loading}
                                        className="h-11 text-xs uppercase tracking-widest"
                                        leftIcon={<ArrowRight className="w-4 h-4" />}
                                    >
                                        Comenzar
                                    </Button>
                                )}

                                {(estado === 'PENDIENTE' || estado === 'EN_CURSO') && (
                                    <Button
                                        onClick={() => cambiarEstado('FINALIZADO')}
                                        isLoading={loading}
                                        className="h-11 text-xs uppercase tracking-widest"
                                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                                    >
                                        Finalizar
                                    </Button>
                                )}

                                <Button
                                    variant="secondary"
                                    onClick={() => cambiarEstado('NO_ASISTIO')}
                                    isLoading={loading}
                                    className="h-11 text-xs uppercase tracking-widest"
                                >
                                    No Asistió
                                </Button>

                                <Button
                                    variant={confirmCancel ? 'danger' : 'secondary'}
                                    onClick={() => confirmCancel ? cambiarEstado('CANCELADO') : setConfirmCancel(true)}
                                    isLoading={loading}
                                    className={`h-11 text-xs uppercase tracking-widest ${confirmCancel ? 'animate-pulse' : ''}`}
                                    leftIcon={<AlertTriangle className="w-4 h-4" />}
                                >
                                    {confirmCancel ? 'Confirmar' : 'Cancelar'}
                                </Button>
                            </div>
                            {confirmCancel && (
                                <button
                                    onClick={() => setConfirmCancel(false)}
                                    className="w-full text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-tighter transition-colors"
                                >
                                    Volver atrás
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                    <Button
                        variant="ghost"
                        fullWidth
                        onClick={onClose}
                        className="text-xs uppercase tracking-widest font-black"
                    >
                        Cerrar Detalle
                    </Button>
                </div>
            </div>
        </div>
    );
}
