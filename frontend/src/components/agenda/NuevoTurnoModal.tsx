'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Clock, Scissors, UserCircle, Search, Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

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

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);

        try {
            if (!barberoId || !servicioId || !fechaHoraInicio) {
                throw new Error('Por favor, completa todos los campos obligatorios');
            }

            const body: any = {
                barberoId,
                servicioId,
                fechaHoraInicio: new Date(fechaHoraInicio).toISOString() // Envia en UTC ISO
            };

            if (modoNuevoCliente) {
                if (!nombreCliente.trim()) throw new Error('El nombre del cliente es obligatorio');
                body.nombreCliente = nombreCliente;
                body.telefonoCliente = telefonoCliente;
            } else {
                if (!clienteId) throw new Error('Selecciona un cliente de la lista o crea uno nuevo');
                body.clienteId = clienteId;
            }

            const res = await fetch(`${API}/turnos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                // El backend ahora devuelve errores más específicos
                throw new Error(data.error || 'No se pudo agendar el turno. Verifica la disponibilidad.');
            }

            toast.success('¡Turno agendado con éxito!');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message, {
                duration: 4000,
                style: {
                    background: '#FEF2F2',
                    color: '#991B1B',
                    border: '1px solid #FEE2E2',
                    fontSize: '14px',
                    fontWeight: '500'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const selectedServicio = servicios.find(s => s.id === servicioId);
    const selectedCliente = clientes.find(c => c.id === clienteId);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-white" />
                    </div>
                    Nuevo Turno
                </div>
            }
            footer={
                <div className="flex items-center gap-4 w-full">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={loading}
                        className={`flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            'Agendar Turno'
                        )}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Barbero & Servicio */}
                <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">Barbero asignado</label>
                        <div className="relative group">
                            <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                            <select
                                value={barberoId}
                                onChange={e => setBarberoId(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold cursor-pointer"
                            >
                                <option value="">Seleccionar barbero</option>
                                {barberos.map(b => (
                                    <option key={b.BarberoProfile?.id} value={b.BarberoProfile?.id}>
                                        {b.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">Servicio a realizar</label>
                        <div className="relative group">
                            <Scissors className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                            <select
                                value={servicioId}
                                onChange={e => setServicioId(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold cursor-pointer"
                            >
                                <option value="">Seleccionar servicio</option>
                                {servicios.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.nombre} (${s.precio})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Fecha y Hora */}
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">Fecha y Hora de Inicio</label>
                    <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <input
                            type="datetime-local"
                            value={fechaHoraInicio}
                            onChange={e => setFechaHoraInicio(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold"
                        />
                    </div>
                    {horaFinCalculada && (
                        <div className="flex items-center gap-2 px-1 pt-1">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-xs text-slate-500 font-medium">
                                Termina a las <span className="text-slate-900 font-bold">{horaFinCalculada}</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Cliente Selection */}
                <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Cliente</label>
                        <button
                            type="button"
                            onClick={() => { setModoNuevoCliente(!modoNuevoCliente); setClienteId(''); }}
                            className="text-[11px] font-bold text-slate-900 px-3 py-1 bg-slate-100 rounded-full hover:scale-105 transition-all uppercase"
                        >
                            {modoNuevoCliente ? 'Buscar' : 'Nuevo'}
                        </button>
                    </div>

                    {modoNuevoCliente ? (
                        <div className="space-y-3 p-1 animate-in slide-in-from-top-2 duration-300">
                            <Input
                                placeholder="Nombre completo *"
                                value={nombreCliente}
                                onChange={e => setNombreCliente(e.target.value)}
                                className="bg-slate-50 border-slate-200 rounded-2xl h-12 text-sm font-semibold"
                            />
                            <Input
                                placeholder="Teléfono móvil"
                                value={telefonoCliente}
                                onChange={e => setTelefonoCliente(e.target.value)}
                                className="bg-slate-50 border-slate-200 rounded-2xl h-12 text-sm font-semibold"
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre..."
                                    value={searchCliente}
                                    onChange={e => { setSearchCliente(e.target.value); setClienteId(''); }}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-semibold"
                                />

                                {/* Dropdown resultados */}
                                {filteredClientes.length > 0 && !clienteId && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-[20px] shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                                        {filteredClientes.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => { setClienteId(c.id); setSearchCliente(c.nombre); setFilteredClientes([]); }}
                                                className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                                            >
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900">{c.nombre}</div>
                                                    {c.telefono && <div className="text-[10px] text-slate-400 font-medium">{c.telefono}</div>}
                                                </div>
                                                <Plus className="w-4 h-4 text-slate-300" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedCliente && (
                                <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl shadow-sm animate-in fade-in duration-300 border border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold">
                                            {selectedCliente.nombre.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{selectedCliente.nombre}</div>
                                            <div className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Cliente Seleccionado</div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setClienteId(''); setSearchCliente(''); }}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
