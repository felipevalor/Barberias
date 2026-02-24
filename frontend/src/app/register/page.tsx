'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        nombreBarberia: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al registrarse');
            }

            // Automatically redirect to login on success
            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        Crea tu Barbería
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Regístrate como administrador para empezar
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-xl" role="alert" aria-live="polite">
                            <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Input
                            label="Nombre Completo"
                            name="nombre"
                            type="text"
                            required
                            placeholder="Juan Pérez"
                            value={formData.nombre}
                            onChange={handleChange}
                            autoComplete="name"
                        />

                        <Input
                            label="Nombre de la Barbería"
                            name="nombreBarberia"
                            type="text"
                            required
                            placeholder="The Classic Barber"
                            value={formData.nombreBarberia}
                            onChange={handleChange}
                        />

                        <Input
                            label="Correo Electrónico"
                            name="email"
                            type="email"
                            required
                            placeholder="juan@ejemplo.com"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                        />

                        <Input
                            label="Contraseña"
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                        />
                    </div>

                    <Button
                        type="submit"
                        isLoading={loading}
                        fullWidth
                        className="h-12 text-base"
                    >
                        Terminar Registro
                    </Button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            ¿Ya tienes una cuenta?{' '}
                            <a href="/login" className="font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">
                                Inicia sesión
                            </a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
