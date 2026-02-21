'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

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
                const res = await fetch('http://localhost:3001/api/staff', {
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

            const res = await fetch('http://localhost:3001/api/servicios', {
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

            router.push('/dashboard/servicios');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Añadir Nuevo Servicio</h2>
                <Link href="/dashboard/servicios" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Volver al catálogo
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 p-4 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Servicio *</label>
                            <input
                                type="text"
                                required
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Ej. Corte Fade, Perfilado de Barba..."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                            <textarea
                                value={formData.descripcion}
                                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Descripción detallada para el cliente..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio ($) *</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={formData.precio}
                                onChange={e => setFormData({ ...formData, precio: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración (minutos) *</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={formData.duracionMinutos}
                                onChange={e => setFormData({ ...formData, duracionMinutos: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Ej. 45"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Barberos Habilitados</h3>
                        <p className="text-sm text-gray-500 mb-4">Selecciona los barberos capacitados para realizar este servicio.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {barberos.map(barbero => {
                                const profileId = barbero.BarberoProfile?.id;
                                if (!profileId) return null;
                                const isSelected = selectedBarberos.includes(profileId);

                                return (
                                    <div
                                        key={profileId}
                                        onClick={() => handleToggleBarbero(profileId)}
                                        className={`cursor-pointer border rounded-lg p-4 flex items-center transition-colors ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-500'}`}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">{barbero.nombre}</p>
                                            <p className="text-xs text-gray-500">{barbero.BarberoProfile?.especialidad || 'Barbero'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {barberos.length === 0 && (
                                <div className="col-span-3 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                                    Aún no tienes barberos registrados. Podrás asignarlos más tarde.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end space-x-3">
                        <Link
                            href="/dashboard/servicios"
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Crear Servicio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
