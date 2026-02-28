'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ChevronLeft, UserPlus, Mail, Phone, Scissors, BadgePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function NewStaffPage() {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        especialidad: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { token } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API}/staff`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al crear barbero');
            }

            toast.success(`${formData.nombre} ha sido añadido al equipo`);
            router.push('/dashboard/staff');
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || 'Error al crear barbero');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <div>
                <Link
                    href="/dashboard/staff"
                    className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-4 group"
                >
                    <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
                    Volver al equipo
                </Link>
                <div className="flex items-center">
                    <div className="bg-blue-600 p-3 rounded-2xl mr-4 shadow-blue-200 shadow-lg">
                        <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Nuevo Personal</h2>
                        <p className="text-slate-500 font-medium">Registra un nuevo barbero en tu sistema.</p>
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
                        <Input
                            label="Nombre Completo"
                            required
                            leftIcon={<Scissors className="w-4 h-4" />}
                            placeholder="Ej. Martín Gómez"
                            value={formData.nombre}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                        />

                        <Input
                            label="Correo Electrónico"
                            type="email"
                            required
                            leftIcon={<Mail className="w-4 h-4" />}
                            placeholder="martin@barberia.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />

                        <Input
                            label="Teléfono de Contacto"
                            type="tel"
                            leftIcon={<Phone className="w-4 h-4" />}
                            placeholder="+54 11 1234 5678"
                            value={formData.telefono}
                            onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                        />

                        <Input
                            label="Especialidad"
                            leftIcon={<BadgePlus className="w-4 h-4" />}
                            placeholder="Cortes clásicos, barba..."
                            value={formData.especialidad}
                            onChange={e => setFormData({ ...formData, especialidad: e.target.value })}
                        />
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
                        <Link href="/dashboard/staff" className="w-full sm:w-auto">
                            <Button variant="secondary" fullWidth className="h-12 px-8">
                                Cancelar
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            isLoading={loading}
                            fullWidth
                            className="h-12 px-10"
                        >
                            Confirmar y Crear
                        </Button>
                    </div>
                </form>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-start">
                <div className="bg-white p-2 rounded-lg border border-slate-200 mr-4 mt-1">
                    <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Información de Acceso</h4>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                        Se le asignará una contraseña temporal <span className="font-bold text-slate-900">123456</span> por defecto. El barbero podrá cambiarla al iniciar sesión por primera vez.
                    </p>
                </div>
            </div>
        </div>
    );
}
