'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function LoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const justRegistered = searchParams.get('registered') === 'true';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Credenciales inválidas');
            }

            login(data.token, data.user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        Bienvenido de nuevo
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Ingresa a tu panel de control de Barberías
                    </p>
                </div>

                {justRegistered && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-green-800 text-sm font-semibold">
                            Registro exitoso. ¡Inicia sesión para continuar!
                        </p>
                    </div>
                )}

                <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
                    {error && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-xl" role="alert" aria-live="polite">
                            <p className="text-red-700 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Input
                            label="Correo Electrónico"
                            name="email"
                            type="email"
                            required
                            placeholder="juan@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />

                        <div className="space-y-1">
                            <Input
                                label="Contraseña"
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                            <div className="flex justify-end">
                                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        isLoading={loading}
                        fullWidth
                        className="h-12 text-base"
                    >
                        Iniciar Sesión
                    </Button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500 font-medium">O continúa con</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            ¿No tienes una cuenta?{' '}
                            <a href="/register" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                                Regístrate gratis
                            </a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 font-medium animate-pulse">Cargando...</p>
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}
