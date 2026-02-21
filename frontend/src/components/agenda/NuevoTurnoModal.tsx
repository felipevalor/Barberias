'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Clock, Scissors, UserCircle, Search, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface NuevoTurnoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    preselectedBarberoId?: string;
    preselectedStart?: Date;
    barberos: any[];
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function NuevoTurnoModal({ isOpen, onClose, onSuccess, preselectedBarberoId, preselectedStart, barberos }: NuevoTurnoModalProps) {
    const { token } = useAuth();

    // Form state
    const [barberoId, setBarberoId] = useState('');
    const [servicioId, setServicioId] = useState('');
    const [clienteId, setClienteId] = useState('');
    const [fechaHoraInicio, setFechaHoraInicio] = useState('');
    const [horaFinCalculada, setHoraFinCalculada] = useState('');

    // Nuevo cliente inline
    const [modoNuevoCliente, setModoNuevoCliente] = useState(false);
    const [nombreCliente, setNombreCliente] = useState('');
    const [telefonoCliente, setTelefonoCliente] = useState('');

    // Data
    const [servicios, setServicios] = useState<any[]>([]);
    const [clientes, setClientes] = useState<any[]>([]);
    const [searchCliente, setSearchCliente] = useState('');
    const [filteredClientes, setFilteredClientes] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch data on open
    useEffect(() => {
        if (!isOpen || !token) return;

        fetch(`${API}/servicios`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                setServicios(data);
                if (data.length > 0 && !servicioId) setServicioId(data[0].id);
            })
            .catch(console.error);

        fetch(`${API}/clientes`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(setClientes)
            .catch(console.error);
    }, [isOpen, token]);

    // Pre-seleccionar barbero y hora
    useEffect(() => {
        if (isOpen) {
            if (preselectedBarberoId) setBarberoId(preselectedBarberoId);
            if (preselectedStart) {
                const dt = new Date(preselectedStart);
                const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}T${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
                setFechaHoraInicio(iso);
            }
        }
    }, [isOpen, preselectedBarberoId, preselectedStart]);

    // Limpiar al cerrar
    useEffect(() => {
        if (!isOpen) {
            setServicioId('');
            setClienteId('');
            setBarberoId('');
            setFechaHoraInicio('');
            setHoraFinCalculada('');
            setModoNuevoCliente(false);
            setNombreCliente('');
            setTelefonoCliente('');
            setSearchCliente('');
            setError('');
        }
    }, [isOpen]);

    // Calcular hora fin cuando cambia servicio u hora de inicio
    useEffect(() => {
        if (fechaHoraInicio && servicioId) {
            const servicio = servicios.find(s => s.id === servicioId);
            if (servicio) {
                const inicio = new Date(fechaHoraInicio);
                const fin = new Date(inicio.getTime() + servicio.duracionMinutos * 60000);
                setHoraFinCalculada(`${String(fin.getHours()).padStart(2, '0')}:${String(fin.getMinutes()).padStart(2, '0')}`);
            }
        } else {
            setHoraFinCalculada('');
        }
    }, [fechaHoraInicio, servicioId, servicios]);

    // Filtrar clientes
    useEffect(() => {
        if (searchCliente.trim()) {
            const q = searchCliente.toLowerCase();
            setFilteredClientes(clientes.filter(c =>
                c.nombre.toLowerCase().includes(q) ||
                c.telefono?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q)
            ).slice(0, 8));
        } else {
            setFilteredClientes([]);
        }
    }, [searchCliente, clientes]);

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const body: any = {
                barberoId,
                servicioId,
                fechaHoraInicio: new Date(fechaHoraInicio).toISOString()
            };

            if (modoNuevoCliente) {
                if (!nombreCliente.trim()) throw new Error('El nombre del cliente es obligatorio');
                body.nombreCliente = nombreCliente;
                body.telefonoCliente = telefonoCliente;
            } else {
                if (!clienteId) throw new Error('Selecciona un cliente');
                body.clienteId = clienteId;
            }

            if (!barberoId || !servicioId || !fechaHoraInicio) {
                throw new Error('Completa todos los campos obligatorios');
            }

            const res = await fetch(`${API}/turnos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Error al crear turno');
            }

            toast.success('Turno creado exitosamente');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const selectedServicio = servicios.find(s => s.id === servicioId);
    const selectedCliente = clientes.find(c => c.id === clienteId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-700">
                    <h3 className="text-lg font-bold text-white flex items-center">
                        <Plus className="w-5 h-5 mr-2" />
                        Nuevo Turno
                    </h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                            {error}
                        </div>
                    )}

                    {/* Barbero */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <Scissors className="w-4 h-4 mr-2 text-blue-500" /> Barbero
                        </label>
                        <select
                            value={barberoId}
                            onChange={e => setBarberoId(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                            <option value="">Seleccionar barbero...</option>
                            {barberos.map(b => (
                                <option key={b.BarberoProfile?.id} value={b.BarberoProfile?.id}>
                                    {b.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Servicio */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <Scissors className="w-4 h-4 mr-2 text-purple-500" /> Servicio
                        </label>
                        <select
                            value={servicioId}
                            onChange={e => setServicioId(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                            <option value="">Seleccionar servicio...</option>
                            {servicios.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.nombre} — ${s.precio} ({s.duracionMinutos} min)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fecha & Hora */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-green-500" /> Fecha y Hora de Inicio
                        </label>
                        <input
                            type="datetime-local"
                            value={fechaHoraInicio}
                            onChange={e => setFechaHoraInicio(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                        {horaFinCalculada && (
                            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                Finaliza a las <span className="font-bold ml-1">{horaFinCalculada}</span>
                                <span className="ml-2 text-gray-400">({selectedServicio?.duracionMinutos} min)</span>
                            </p>
                        )}
                    </div>

                    {/* Cliente */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center">
                                <UserCircle className="w-4 h-4 mr-2 text-amber-500" /> Cliente
                            </label>
                            <button
                                type="button"
                                onClick={() => { setModoNuevoCliente(!modoNuevoCliente); setClienteId(''); }}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition"
                            >
                                {modoNuevoCliente ? 'Buscar existente' : '+ Nuevo cliente'}
                            </button>
                        </div>

                        {modoNuevoCliente ? (
                            <div className="space-y-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <input
                                    type="text"
                                    placeholder="Nombre del cliente *"
                                    value={nombreCliente}
                                    onChange={e => setNombreCliente(e.target.value)}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition text-sm"
                                />
                                <input
                                    type="tel"
                                    placeholder="Teléfono (opcional)"
                                    value={telefonoCliente}
                                    onChange={e => setTelefonoCliente(e.target.value)}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition text-sm"
                                />
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, teléfono o email..."
                                        value={searchCliente}
                                        onChange={e => { setSearchCliente(e.target.value); setClienteId(''); }}
                                        className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition text-sm"
                                    />
                                </div>

                                {/* Dropdown resultados */}
                                {filteredClientes.length > 0 && !clienteId && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                        {filteredClientes.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => { setClienteId(c.id); setSearchCliente(c.nombre); setFilteredClientes([]); }}
                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-600 transition text-sm border-b border-gray-100 dark:border-gray-600 last:border-0"
                                            >
                                                <span className="font-semibold text-gray-900 dark:text-white">{c.nombre}</span>
                                                {c.telefono && <span className="ml-2 text-gray-500 dark:text-gray-400 text-xs">{c.telefono}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {selectedCliente && clienteId && (
                                    <div className="mt-2 flex items-center justify-between bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-200 dark:border-green-900/30">
                                        <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                                            ✓ {selectedCliente.nombre}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => { setClienteId(''); setSearchCliente(''); }}
                                            className="text-xs text-red-500 hover:text-red-600 font-medium"
                                        >Cambiar</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Resumen */}
                    {selectedServicio && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Resumen</h4>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Servicio</span>
                                <span className="font-bold text-gray-900 dark:text-white">{selectedServicio.nombre}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Duración</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{selectedServicio.duracionMinutos} min</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Precio</span>
                                <span className="font-black text-blue-600 dark:text-blue-400 text-lg">${selectedServicio.precio}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                    >
                        {loading ? 'Guardando...' : 'Agendar Turno'}
                    </button>
                </div>
            </div>
        </div>
    );
}
