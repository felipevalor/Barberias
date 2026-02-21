'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Package, DollarSign, Save } from 'lucide-react';

export default function NewProductoPage() {
    const router = useRouter();
    const { token } = useAuth();

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precioVenta: '',
        stockActual: '0',
        stockMinimo: '0'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                precioVenta: parseFloat(formData.precioVenta),
                stockActual: parseInt(formData.stockActual),
                stockMinimo: parseInt(formData.stockMinimo)
            };

            const res = await fetch('http://localhost:3001/api/productos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al crear producto');
            }

            router.push('/dashboard/productos');
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-12">
            <div className="mb-6 flex space-x-4 items-center">
                <Link href="/dashboard/productos" className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Producto</h2>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center">
                    <Package className="w-5 h-5 mr-3 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Información del Artículo</h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre del Producto</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white dark:bg-gray-700 dark:focus:bg-gray-600 dark:text-white transition-colors"
                            placeholder="Ej. Cera Mate Fijación Fuerte"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Descripción (Opcional)</label>
                        <textarea
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white dark:bg-gray-700 dark:focus:bg-gray-600 dark:text-white transition-colors"
                            placeholder="Detalles sobre el producto..."
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Precio Venta</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <DollarSign className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    min="0"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white dark:bg-gray-700 dark:focus:bg-gray-600 dark:text-white transition-colors font-semibold"
                                    placeholder="0.00"
                                    value={formData.precioVenta}
                                    onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Stock Inicial</label>
                            <input
                                type="number"
                                required
                                min="0"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white dark:bg-gray-700 dark:focus:bg-gray-600 dark:text-white transition-colors"
                                value={formData.stockActual}
                                onChange={(e) => setFormData({ ...formData, stockActual: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alerta Stock Mínimo</label>
                            <input
                                type="number"
                                required
                                min="0"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white dark:bg-gray-700 dark:focus:bg-gray-600 dark:text-white transition-colors"
                                value={formData.stockMinimo}
                                onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition flex items-center disabled:opacity-50"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            {loading ? 'Guardando...' : 'Crear Producto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
