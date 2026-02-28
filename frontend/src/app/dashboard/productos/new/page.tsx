'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ChevronLeft, Package, DollarSign, Layers, BellRing, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

            const res = await fetch(`${API}/productos`, {
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

            toast.success('Producto creado exitosamente');
            router.push('/dashboard/productos');
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || 'Error al crear producto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <div>
                <Link
                    href="/dashboard/productos"
                    className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors mb-4 group"
                >
                    <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
                    Volver al inventario
                </Link>
                <div className="flex items-center">
                    <div className="bg-indigo-600 p-3 rounded-2xl mr-4 shadow-indigo-200 shadow-lg mt-0.5">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Nuevo Producto</h2>
                        <p className="text-slate-500 font-medium">Añade un artículo a tu catálogo de ventas.</p>
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
                                label="Nombre del Producto"
                                required
                                leftIcon={<Package className="w-4 h-4" />}
                                placeholder="Ej. Cera Mate Fijación Fuerte"
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción (Opcional)</label>
                            <textarea
                                value={formData.descripcion}
                                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 transition-all duration-200"
                                placeholder="Detalles particulares del artículo, uso, marca..."
                                rows={3}
                            />
                        </div>

                        <Input
                            label="Precio Venta ($)"
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            leftIcon={<DollarSign className="w-4 h-4" />}
                            placeholder="0.00"
                            value={formData.precioVenta}
                            onChange={e => setFormData({ ...formData, precioVenta: e.target.value })}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Stock Inicial"
                                type="number"
                                min="0"
                                required
                                leftIcon={<Layers className="w-4 h-4" />}
                                value={formData.stockActual}
                                onChange={e => setFormData({ ...formData, stockActual: e.target.value })}
                            />

                            <Input
                                label="Alerta Mínimo"
                                type="number"
                                min="0"
                                required
                                leftIcon={<BellRing className="w-4 h-4" />}
                                value={formData.stockMinimo}
                                onChange={e => setFormData({ ...formData, stockMinimo: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
                        <Link href="/dashboard/productos" className="w-full sm:w-auto">
                            <Button variant="secondary" fullWidth className="h-12 px-8">
                                Cancelar
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            isLoading={loading}
                            fullWidth
                            leftIcon={<Save className="w-4 h-4" />}
                            className="h-12 px-10 bg-indigo-600 hover:bg-indigo-700 group"
                        >
                            Confirmar y Crear
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
