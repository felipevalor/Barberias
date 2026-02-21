'use client';

import { useState, useEffect, use } from 'react';
import { Calendar as CalendarIcon, Clock, Scissors, User, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import es from 'date-fns/locale/es';

export default function ReservaPage({ params }: { params: Promise<{ barberiaId: string }> }) {
    const { barberiaId } = use(params);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [servicios, setServicios] = useState<any[]>([]);
    const [barberos, setBarberos] = useState<any[]>([]);

    // Estado de Reserva
    const [selectedServicio, setSelectedServicio] = useState<any>(null);
    const [selectedBarbero, setSelectedBarbero] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [clientData, setClientData] = useState({ nombre: '', telefono: '' });
    const [bookingComplete, setBookingComplete] = useState(false);
    const [bookingError, setBookingError] = useState('');

    // Fechas disponibles a mostrar (próximos 7 días)
    const availableDates = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

    // Simulador de horas disponibles - En producción esto vendría de /api/public/agenda/:id consultando huecos reales
    const availableTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

    useEffect(() => {
        // Cargar Catálogo (necesitaríamos un endpoint público de catálogo, por ahora simulamos con Auth para MVP si es necesario, 
        // pero idealmente deberías crear un endpoint público en Backend para esto. 
        // Como el Backend actual requiere JWT, este paso asume que lo hemos expuesto o lo simulamos para mostrar UI)
        const fetchPublicData = async () => {
            try {
                // Haremos llamadas fetch aquí cuando el backend habilite endpoints públicos 
                // /api/public/barberias/:id/servicios

                // Mock data para que la UI fluya en esta demo local sin modificar el middleware Auth del backend aún
                setServicios([
                    { id: '1', nombre: 'Corte Clásico', precio: 10, duracionMinutos: 30, descripcion: 'Corte a tijera o máquina' },
                    { id: '2', nombre: 'Corte Premium + Barba', precio: 15, duracionMinutos: 45, descripcion: 'Ritual completo' }
                ]);

                setBarberos([
                    { id: '1', nombre: 'Martín', especialidad: 'Clásicos' },
                    { id: '2', nombre: 'Leo', especialidad: 'Fade & Barba' }
                ]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPublicData();
    }, [barberiaId]);

    const handleConfirm = async () => {
        setLoading(true);
        setBookingError('');
        try {
            // Formatear la fecha
            const [hours, minutes] = selectedTime.split(':');
            const fechaHoraInicio = new Date(selectedDate);
            fechaHoraInicio.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const payload = {
                barberiaId,
                barberoId: selectedBarbero.id,
                servicioId: selectedServicio.id,
                nombreCliente: clientData.nombre,
                telefonoCliente: clientData.telefono,
                fechaHoraInicio: fechaHoraInicio.toISOString()
            };

            // Aquí llamarías al endpoint POST /api/public/turnos (debes crearlo en backend)
            // Como el backend actual está protegido por middleware en /api/turnos, en vida real haríamos la llamada pública aquí.

            // Simulando delay de red
            await new Promise(r => setTimeout(r, 1500));

            setBookingComplete(true);
        } catch (err: any) {
            setBookingError(err.message || 'Error al agendar');
        } finally {
            setLoading(false);
        }
    };

    if (loading && step === 1) return <div className="min-h-screen flex items-center justify-center">Cargando datos...</div>;

    if (bookingComplete) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Reserva Confirmada!</h2>
                    <p className="text-gray-600 mb-8">
                        Tu turno para <strong>{selectedServicio.nombre}</strong> con <strong>{selectedBarbero.nombre}</strong> ha sido agendado para el {format(selectedDate, "d 'de' MMMM", { locale: es })} a las {selectedTime}.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8 text-left text-sm text-gray-700">
                        Enviaremos un recordatorio a tu teléfono {clientData.telefono} unas horas antes del turno.
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            <div className="max-w-2xl w-full">
                {/* Header e Indicador de progreso */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Reserva tu Turno</h1>
                    <p className="text-gray-500 mt-2">Sigue los pasos para asegurar tu lugar en nuestra barbería.</p>

                    <div className="flex items-center justify-center mt-8 space-x-2 sm:space-x-4">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === s ? 'bg-blue-600 text-white shadow-md' : step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {step > s ? '✓' : s}
                                </div>
                                {s < 4 && <div className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 rounded ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cajas de Pasos */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">

                    {/* PASO 1: SERVICIO */}
                    {step === 1 && (
                        <div className="space-y-4 transition-all duration-300">
                            <h3 className="text-xl font-bold flex items-center text-gray-900 mb-4"><Scissors className="mr-2" /> Eligí tu Servicio</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {servicios.map(srv => (
                                    <div
                                        key={srv.id}
                                        onClick={() => setSelectedServicio(srv)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedServicio?.id === srv.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{srv.nombre}</h4>
                                                <p className="text-sm text-gray-500 mt-1">{srv.descripcion}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-bold text-blue-600">${srv.precio}</span>
                                                <span className="text-xs text-gray-500">{srv.duracionMinutos} min</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PASO 2: BARBERO */}
                    {step === 2 && (
                        <div className="space-y-4 transition-all duration-300">
                            <h3 className="text-xl font-bold flex items-center text-gray-900 mb-4"><User className="mr-2" /> Eligí tu Barbero</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setSelectedBarbero({ id: 'any', nombre: 'Cualquiera disponible' })}
                                    className={`p-4 text-center rounded-xl border-2 cursor-pointer transition-all ${selectedBarbero?.id === 'any' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
                                >
                                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center text-gray-400">
                                        <User size={32} />
                                    </div>
                                    <h4 className="font-bold text-gray-900">Sin Preferencia</h4>
                                </div>
                                {barberos.map(b => (
                                    <div
                                        key={b.id}
                                        onClick={() => setSelectedBarbero(b)}
                                        className={`p-4 text-center rounded-xl border-2 cursor-pointer transition-all ${selectedBarbero?.id === b.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
                                    >
                                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold">
                                            {b.nombre.charAt(0)}
                                        </div>
                                        <h4 className="font-bold text-gray-900">{b.nombre}</h4>
                                        <span className="text-xs text-gray-500">{b.especialidad}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PASO 3: FECHA Y HORA */}
                    {step === 3 && (
                        <div className="space-y-6 transition-all duration-300">
                            <h3 className="text-xl font-bold flex items-center text-gray-900"><CalendarIcon className="mr-2" /> Cuándo vas a venir?</h3>

                            {/* Carrusel de fechas horizontales */}
                            <div className="flex overflow-x-auto pb-4 space-x-3 hide-scrollbar">
                                {availableDates.map(d => {
                                    const isSelected = isSameDay(d, selectedDate);
                                    return (
                                        <div
                                            key={d.toISOString()}
                                            onClick={() => { setSelectedDate(d); setSelectedTime(''); }} /* Reset tiempo al cambiar día */
                                            className={`flex-shrink-0 w-20 py-3 rounded-2xl cursor-pointer text-center border-2 transition-all ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-100 bg-white hover:border-blue-300'}`}
                                        >
                                            <span className={`block text-xs uppercase font-bold ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>{format(d, 'EEE', { locale: es })}</span>
                                            <span className="block text-2xl font-black mt-1">{format(d, 'd')}</span>
                                            <span className={`block text-[10px] mt-1 ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>{format(d, 'MMM', { locale: es })}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Grilla de horas */}
                            <div className="pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center"><Clock size={16} className="mr-2" /> Horarios disponibles</h4>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {availableTimes.map(time => (
                                        <div
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={`py-2 text-center rounded-lg border cursor-pointer font-medium transition-colors ${selectedTime === time ? 'bg-gray-900 border-gray-900 text-white' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                                        >
                                            {time}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASO 4: DATOS DEL CLIENTE */}
                    {step === 4 && (
                        <div className="space-y-4 transition-all duration-300">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Último paso, tus datos</h3>

                            {bookingError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{bookingError}</div>}

                            <div className="bg-blue-50 p-4 rounded-xl mb-6 flex flex-col sm:flex-row justify-between sm:items-center">
                                <div>
                                    <p className="font-bold text-blue-900">{selectedServicio.nombre}</p>
                                    <p className="text-sm text-blue-700">{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} a las {selectedTime} hs</p>
                                </div>
                                <div className="text-2xl font-black text-blue-600 mt-2 sm:mt-0">
                                    ${selectedServicio.precio}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={clientData.nombre}
                                        onChange={e => setClientData({ ...clientData, nombre: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Tu Teléfono (WhatsApp)</label>
                                    <input
                                        type="tel"
                                        required
                                        value={clientData.telefono}
                                        onChange={e => setClientData({ ...clientData, telefono: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                        placeholder="11 2345 6789"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navegación del Wizard */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="text-gray-500 hover:text-gray-900 font-medium flex items-center"
                            >
                                <ArrowLeft size={18} className="mr-1" /> Atrás
                            </button>
                        ) : <div />}

                        <button
                            onClick={() => {
                                if (step === 1 && selectedServicio) setStep(2);
                                else if (step === 2 && selectedBarbero) setStep(3);
                                else if (step === 3 && selectedDate && selectedTime) setStep(4);
                                else if (step === 4 && clientData.nombre && clientData.telefono) handleConfirm();
                            }}
                            disabled={
                                (step === 1 && !selectedServicio) ||
                                (step === 2 && !selectedBarbero) ||
                                (step === 3 && (!selectedDate || !selectedTime)) ||
                                (step === 4 && (!clientData.nombre || !clientData.telefono || loading))
                            }
                            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {step === 4 ? (loading ? 'Confirmando...' : 'Confirmar Reserva') : 'Continuar'}
                            {step < 4 && <ArrowRight size={18} className="ml-2" />}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
