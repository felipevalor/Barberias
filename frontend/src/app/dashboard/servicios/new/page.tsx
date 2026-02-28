'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ChevronLeft, Scissors, DollarSign, Clock, Users, PlusCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function NewServicioPage() {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        duracionMinutos: '',
    });
    const [barberos, setBarberos] = useState<any[]>([]);
    const [selectedBarberos, setSelectedBarberos] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();
    const { token } = useAuth();

    useEffect(() => {
        // Cargar barberos para permitir seleccionar cuáles pueden dar el servicio
        const fetchBarberos = async () => {
            try {
                const res = await fetch(`${API}/staff`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setBarberos(data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        if (token) fetchBarberos();
    }, [token]);

    const handleToggleBarbero = (id: string) => {
        if (selectedBarberos.includes(id)) {
            setSelectedBarberos(selectedBarberos.filter(b => b !== id));
        } else {
            setSelectedBarberos([...selectedBarberos, id]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                precio: parseFloat(formData.precio),
                duracionMinutos: parseInt(formData.duracionMinutos),
                barberoIds: selectedBarberos
            };

            const res = await fetch(`${API}/servicios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al crear servicio');
            }

            toast.success('Servicio creado con éxito');
            router.push('/dashboard/servicios');
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || 'Error al crear servicio');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <div>
                <Link
                    href="/dashboard/servicios"
                    className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-4 group"
                >
                    <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
                    Volver al catálogo
                </Link>
                <div className="flex items-center">
                    <div className="bg-emerald-500 p-3 rounded-2xl mr-4 shadow-emerald-200 shadow-lg">
                        <Scissors className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Nuevo Servicio</h2>
                        <p className="text-slate-500 font-medium">Añade un nuevo servicio a tu oferta.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-semibold flex items-center">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-3 animate-pulse"></span>
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="md:col-span-2">
                            <Input
                                label="Nombre del Servicio"
                                required
                                leftIcon={<PlusCircle className="w-4 h-4" />}
                                placeholder="Ej. Corte Fade, Perfilado de Barba..."
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
                            <textarea
                                value={formData.descripcion}
                                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-all duration-200"
                                placeholder="Descripción detallada para el cliente..."
                                rows={3}
                            />
                        </div>

                        <Input
                            label="Precio ($)"
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            leftIcon={<DollarSign className="w-4 h-4" />}
                            placeholder="0.00"
                            value={formData.precio}
                            onChange={e => setFormData({ ...formData, precio: e.target.value })}
                        />

                        <Input
                            label="Duración (minutos)"
                            type="number"
                            min="1"
                            required
                            leftIcon={<Clock className="w-4 h-4" />}
                            placeholder="Ej. 45"
                            value={formData.duracionMinutos}
                            onChange={e => setFormData({ ...formData, duracionMinutos: e.target.value })}
                        />
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                        <div className="flex items-center mb-6">
                            <div className="bg-blue-50 p-2 rounded-lg mr-3">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Barberos Habilitados</h3>
                                <p className="text-sm text-slate-500 mt-0.5">Selecciona quiénes pueden realizar este servicio.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {barberos.map(barbero => {
                                const profileId = barbero.BarberoProfile?.id;
                                if (!profileId) return null;
                                const isSelected = selectedBarberos.includes(profileId);

                                return (
                                    <div
                                        key={profileId}
                                        onClick={() => handleToggleBarbero(profileId)}
                                        className={`cursor-pointer border-2 rounded-2xl p-4 flex items-center transition-all duration-200 ${isSelected ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-100 hover:border-blue-200 bg-white'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{barbero.nombre}</p>
                                            <p className="text-xs font-medium text-slate-500 mt-0.5">{barbero.BarberoProfile?.especialidad || 'Barbero'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {barberos.length === 0 && (
                                <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm">
                                    Aún no tienes barberos registrados. Podrás asignarlos más tarde creando staff en el panel.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
                        <Link href="/dashboard/servicios" className="w-full sm:w-auto">
                            <Button variant="secondary" fullWidth className="h-12 px-8">
                                Cancelar
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            isLoading={loading}
                            fullWidth
                            className="h-12 px-10 bg-emerald-600 hover:bg-emerald-700 group"
                        >
                            Confirmar y Crear
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
