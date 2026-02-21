'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Package, Search, Plus, AlertTriangle, Edit, Trash2 } from 'lucide-react';

export default function ProductosPage() {
    const [productos, setProductos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { token, user } = useAuth();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

    const fetchProductos = async () => {
        try {
            setLoading(true);
            const url = new URL('http://localhost:3001/api/productos');
            if (searchQuery) url.searchParams.append('q', searchQuery);

            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setProductos(await res.json());
            }
        } catch (err) {
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

    const handleDelete = async (id: string, nombre: string) => {
        if (!window.confirm(`¿Estás seguro de eliminar el producto "${nombre}"?`)) return;
        try {
            const res = await fetch(`http://localhost:3001/api/productos/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchProductos();
        } catch (err) {
            console.error('Error eliminando producto', err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Package className="w-6 h-6 mr-2 text-blue-600" />
                        Inventario de Productos
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Gesti&oacute;n de stock y precios de venta</p>
                </div>

                <div className="flex w-full sm:w-auto space-x-3">
                    <div className="relative flex-1 sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Buscar producto..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {isAdmin && (
                        <Link
                            href="/dashboard/productos/new"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center font-medium shadow-sm whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5 mr-1" /> Nuevo Producto
                        </Link>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading && productos.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Cargando inventario...</div>
                ) : productos.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Inventario Vacío</h3>
                        <p className="text-gray-500 mb-4 text-sm max-w-sm">No hay productos registrados. Agrega ceras, aceites u otros artículos para poder venderlos en caja.</p>
                        {isAdmin && (
                            <Link href="/dashboard/productos/new" className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold py-2 px-6 rounded-lg hover:bg-blue-200 transition">
                                Agregar Primer Producto
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Disponible</th>
                                    {isAdmin && <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                {productos.map((prod) => {
                                    const stockBajo = prod.stockActual <= prod.stockMinimo;

                                    return (
                                        <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-gray-900 dark:text-white">{prod.nombre}</div>
                                                {prod.descripcion && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{prod.descripcion}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-black text-blue-600 dark:text-blue-400">${prod.precioVenta}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold mx-auto border ${stockBajo ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'}`}>
                                                        {prod.stockActual} u.
                                                    </span>
                                                    {stockBajo && (
                                                        <span className="text-[10px] text-red-600 dark:text-red-400 mt-1 flex items-center font-bold uppercase">
                                                            <AlertTriangle className="w-3 h-3 mr-0.5" /> Stock Bajo
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        {/* TODO: Implementar vista de edición */}
                                                        <button className="text-gray-400 hover:text-blue-600 transition p-2 disabled:opacity-50" disabled title="Editar próximamente">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(prod.id, prod.nombre)}
                                                            className="text-gray-400 hover:text-red-600 transition p-2"
                                                            title="Eliminar producto"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
