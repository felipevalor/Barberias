'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Eye, EyeOff, Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const { token } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    const handleReset = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas nuevas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al cambiar la contraseña');
            }

            toast.success('Contraseña actualizada exitosamente');
            handleReset();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                    Configuración de Cuenta
                </h1>
                <p className="text-gray-500 mt-1">Gestiona tu seguridad y preferencias de la cuenta.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-amber-500" />
                        Seguridad
                    </h2>
                    <p className="text-sm text-gray-500">Actualiza tu contraseña periódicamente para mantener tu cuenta segura.</p>
                </div>

                <form onSubmit={handleChangePassword} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Contraseña Actual
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(!showPasswords)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nueva Contraseña
                                </label>
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirmar Nueva Contraseña
                                </label>
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 max-w-sm">
                            La nueva contraseña debe tener al menos 6 caracteres e incluir una combinación de letras y números.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
