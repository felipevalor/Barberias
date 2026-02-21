'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { UserCircle, Phone, Mail, FileText, ArrowLeft, CalendarDays, Clock, Save, History } from 'lucide-react';
import { format, isPast } from 'date-fns';
import es from 'date-fns/locale/es';

export default function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { token } = useAuth();

    const [cliente, setCliente] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notesDraft, setNotesDraft] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    const fetchCliente = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/clientes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCliente(data);
                setNotesDraft(data.notasPreferencias || '');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchCliente();
    }, [token, id]);

    const handleSaveNotes = async () => {
        setSavingNotes(true);
        try {
            const res = await fetch(`http://localhost:3001/api/clientes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ notasPreferencias: notesDraft })
            });
            if (res.ok) {
                setCliente({ ...cliente, notasPreferencias: notesDraft });
                setIsEditingNotes(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSavingNotes(false);
        }
    };

    if (loading) return <div>Cargando Perfil...</div>;
    if (!cliente) return <div>Cliente no encontrado.</div>;

    const pastTurnos = cliente.turnos.filter((t: any) => isPast(new Date(t.fechaHoraInicio)));
    const futureTurnos = cliente.turnos.filter((t: any) => !isPast(new Date(t.fechaHoraInicio)));

    const getStatusBadge = (status: string) => {
        const map: any = {
            'PENDIENTE': 'bg-blue-100 text-blue-800',
            'EN_CURSO': 'bg-orange-100 text-orange-800',
            'FINALIZADO': 'bg-green-100 text-green-800',
            'CANCELADO': 'bg-red-100 text-red-800',
            'NO_ASISTIO': 'bg-gray-100 text-gray-800',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${map[status] || 'bg-gray-100'}`}>{status}</span>;
    };

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="mb-6 flex space-x-4 items-center">
                <Link href="/dashboard/clientes" className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ficha del Cliente</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Columna Izquierda: Perfil y Notas */}
                <div className="md:col-span-1 space-y-6">
                    {/* Card Principal */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
                        <div className="w-24 h-24 mx-auto bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-4xl mb-4">
                            {cliente.nombre.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{cliente.nombre}</h3>
                        <p className="text-gray-500 text-sm mb-6">Cliente desde {format(new Date(cliente.createdAt), 'MMM yyyy', { locale: es })}</p>

                        <div className="space-y-4 text-left">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                                <Phone className="w-4 h-4 mr-3 text-gray-400" />
                                {cliente.telefono || 'Sin teléfono'}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                                <Mail className="w-4 h-4 mr-3 text-gray-400" />
                                {cliente.email || 'Sin correo electrónico'}
                            </div>
                        </div>
                    </div>

                    {/* Notas y Preferencias (RF-21) */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex justify-between items-center">
                            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                                <FileText className="w-4 h-4 mr-2 text-gray-500" />
                                Notas de Preferencias
                            </h4>
                            {!isEditingNotes && (
                                <button onClick={() => setIsEditingNotes(true)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                            )}
                        </div>
                        <div className="p-4">
                            {isEditingNotes ? (
                                <div className="space-y-3">
                                    <textarea
                                        value={notesDraft}
                                        onChange={(e) => setNotesDraft(e.target.value)}
                                        className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 dark:text-white"
                                        placeholder="Escribe características o preferencias especiales para este cliente... (Ej: Usar tijera, piel sensible a la navaja)."
                                    />
                                    <div className="flex justify-end space-x-2">
                                        <button onClick={() => { setIsEditingNotes(false); setNotesDraft(cliente.notasPreferencias || ''); }} className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg">Cancelar</button>
                                        <button onClick={handleSaveNotes} disabled={savingNotes} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center">
                                            <Save className="w-3 h-3 mr-1" /> {savingNotes ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className={`text-sm ${cliente.notasPreferencias ? 'text-gray-700 dark:text-gray-300 whitespace-pre-line' : 'text-gray-400 italic'}`}>
                                    {cliente.notasPreferencias || 'No hay notas guardadas. Has click en editar para agregar detalles.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Historial de Turnos */}
                <div className="md:col-span-2 space-y-6">

                    {/* Próximas Citas */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-blue-50/30 dark:bg-gray-900/50">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                <CalendarDays className="w-5 h-5 mr-2 text-blue-600" />
                                Próximos Turnos ({futureTurnos.length})
                            </h3>
                        </div>
                        <div className="p-0">
                            {futureTurnos.length === 0 ? (
                                <div className="p-6 text-center text-sm text-gray-500">No hay turnos futuros programados.</div>
                            ) : (
                                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {futureTurnos.map((turno: any) => (
                                        <li key={turno.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition">
                                            <div className="flex items-start mb-4 sm:mb-0">
                                                <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-xl mr-4 text-center min-w-[60px]">
                                                    <span className="block text-xl font-bold text-blue-700 dark:text-blue-400">{format(new Date(turno.fechaHoraInicio), 'd')}</span>
                                                    <span className="block text-xs font-medium text-blue-600 dark:text-blue-500 uppercase">{format(new Date(turno.fechaHoraInicio), 'MMM', { locale: es })}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white">{turno.servicio?.nombre}</h4>
                                                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                                        {format(new Date(turno.fechaHoraInicio), 'HH:mm')} - {format(new Date(turno.fechaHoraFin), 'HH:mm')} hs
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Con: {turno.barbero?.user?.nombre}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {getStatusBadge(turno.estado)}
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">${turno.servicio?.precio}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Historial (Turnos Pasados) */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                <History className="w-5 h-5 mr-2 text-gray-500" />
                                Historial Pasado ({pastTurnos.length})
                            </h3>
                        </div>
                        <div>
                            {pastTurnos.length === 0 ? (
                                <div className="p-6 text-center text-sm text-gray-500">Aún no hay visitas pasadas registradas.</div>
                            ) : (
                                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {pastTurnos.map((turno: any) => (
                                        <li key={turno.id} className="px-6 py-4 flex items-center justify-between opacity-80 hover:opacity-100 transition">
                                            <div>
                                                <div className="flex items-center space-x-3 mb-1">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{format(new Date(turno.fechaHoraInicio), 'd MMM yyyy', { locale: es })}</span>
                                                    {getStatusBadge(turno.estado)}
                                                </div>
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-300">{turno.servicio?.nombre}</p>
                                                <p className="text-xs text-gray-500 mt-1">Atendido por {turno.barbero?.user?.nombre}</p>
                                            </div>
                                            <span className="font-medium text-gray-600 dark:text-gray-400">${turno.servicio?.precio}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
