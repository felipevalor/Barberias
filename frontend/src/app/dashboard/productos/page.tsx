'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Package, Search, PlusCircle, AlertTriangle, Edit, Trash2, DollarSign, Layers } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ProductosPage() {
    const [productos, setProductos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<{ id: string, nombre: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { token, user } = useAuth();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

    const fetchProductos = async () => {
        try {
            setLoading(true);
            const url = new URL(`${API}/productos`);
            if (searchQuery) url.searchParams.append('q', searchQuery);

            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setProductos(await res.json());
            }
        } catch (err: any) {
            toast.error('Error al cargar inventario');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            const timeoutId = setTimeout(() => fetchProductos(), 300);
            return () => clearTimeout(timeoutId);
        }
    }, [token, searchQuery]);

    const handleDeleteClick = (id: string, nombre: string) => {
        setProductToDelete({ id, nombre });
        setIsConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`${API}/productos/${productToDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Producto eliminado exitosamente');
                fetchProductos();
            } else {
                throw new Error('No se pudo eliminar el producto');
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
            setProductToDelete(null);
        }
    };

    if (loading && productos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Cargando inventario...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
                        <Package className="w-7 h-7 mr-3 text-indigo-600" />
                        Inventario
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Gesti&oacute;n de stock y precios de venta de productos.</p>
                </div>

                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                    <div className="relative flex-1 sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-all"
                            placeholder="Buscar producto..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {isAdmin && (
                        <Link href="/dashboard/productos/new">
                            <Button
                                leftIcon={<PlusCircle className="w-4 h-4" />}
                                className="shadow-sm hover:shadow-md transition-all h-[42px] bg-indigo-600 hover:bg-indigo-700 w-full"
                            >
                                Nuevo Producto
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productos.length === 0 && !loading ? (
                    <div className="col-span-full bg-white border border-slate-200 border-dashed rounded-3xl p-12 text-center">
                        <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Inventario Vacío</h3>
                        <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">No hay productos registrados en tu stock. Agrega artículos de venta.</p>
                        {isAdmin && (
                            <Link href="/dashboard/productos/new">
                                <Button className="h-10 text-xs bg-indigo-600 hover:bg-indigo-700">Añadir Primer Producto</Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    productos.map((prod) => {
                        const isLowStock = prod.stockActual <= prod.stockMinimo;

                        return (
                            <div key={prod.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative flex flex-col h-full hover:border-indigo-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center rounded-xl text-xl font-black shadow-inner">
                                        {prod.nombre.charAt(0)}
                                    </div>
                                    <div className="flex bg-white shadow-sm border border-slate-100 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isAdmin && (
                                            <>
                                                <button className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-50 transition-colors" title="Editar">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(prod.id, prod.nombre)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-50 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-slate-900 truncate" title={prod.nombre}>{prod.nombre}</h3>
                                    <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed h-10">
                                        {prod.descripcion || 'Sin descripción detallada.'}
                                    </p>
                                </div>

                                <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-2 text-center divide-x divide-slate-100">
                                    <div className="flex flex-col items-center justify-center">
                                        <DollarSign className="w-4 h-4 mb-1 text-slate-400" />
                                        <span className="text-xl font-black text-slate-900">${prod.precioVenta}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center relative">
                                        <Layers className={`w-4 h-4 mb-1 ${isLowStock ? 'text-orange-500' : 'text-indigo-500'}`} />
                                        <span className={`text-xl font-black ${isLowStock ? 'text-orange-600' : 'text-slate-900'}`}>
                                            {prod.stockActual}
                                        </span>
                                        {isLowStock && (
                                            <div className="absolute top-0 right-2 w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
                                        )}
                                        {isLowStock && (
                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 rounded-sm mt-1 uppercase tracking-wider flex items-center">
                                                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> stock bajo
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar producto?"
                message={`¿Estás seguro de que deseas eliminar permanentemente "${productToDelete?.nombre}" del inventario?`}
                confirmText="Eliminar Producto"
                type="danger"
                loading={isDeleting}
            />
        </div>
    );
}
