'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Search, UserCircle, Calendar, ChevronRight, Pencil, X, Trash2 } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

export default function DirectorioClientesPage() {
    const [clientes, setClientes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { token } = useAuth();

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [clienteToEdit, setClienteToEdit] = useState<any>(null);
    const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '', notasPreferencias: '' });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState(false);

    // Delete State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clienteToDelete, setClienteToDelete] = useState<any>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const url = new URL('http://localhost:3001/api/clientes');
            if (searchQuery) url.searchParams.append('q', searchQuery);

            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setClientes(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            // Pequeño debounce para no saturar al tipear
            const timeoutId = setTimeout(() => fetchClientes(), 300);
            return () => clearTimeout(timeoutId);
        }
    }, [token, searchQuery]);

    const handleOpenEditModal = (cliente: any) => {
        setClienteToEdit(cliente);
        setFormData({
            nombre: cliente.nombre || '',
            email: cliente.email || '',
            telefono: cliente.telefono || '',
            notasPreferencias: cliente.notasPreferencias || ''
        });
        setFormError('');
        setFormSuccess(false);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setClienteToEdit(null);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !clienteToEdit) return;

        try {
            setFormLoading(true);
            setFormError('');

            const res = await fetch(`http://localhost:3001/api/clientes/${clienteToEdit.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al actualizar el cliente');
            }

            setFormSuccess(true);
            setTimeout(() => {
                handleCloseEditModal();
                fetchClientes();
            }, 1000);
        } catch (err: any) {
            setFormError(err.message || 'Ocurrió un error inesperado');
        } finally {
            setFormLoading(false);
        }
    };

    const handleOpenDeleteModal = (cliente: any) => {
        setClienteToDelete(cliente);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!token || !clienteToDelete) return;

        try {
            setDeleteLoading(true);
            const res = await fetch(`http://localhost:3001/api/clientes/${clienteToDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al eliminar cliente');
            }

            setIsDeleteModalOpen(false);
            setClienteToDelete(null);
            fetchClientes();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Directorio de Clientes</h2>

                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                        placeholder="Buscar por nombre o teléfono..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading && clientes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Cargando clientes...</div>
                ) : clientes.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <UserCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No hay clientes</h3>
                        <p className="text-gray-500">
                            {searchQuery ? 'No se encontraron resultados para tu búsqueda.' : 'Los clientes aparecerán aquí automáticamente cuando agenden un turno.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alta en Sistema</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Historial</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200 text-sm">
                                {clientes.map((cliente) => (
                                    <tr key={cliente.id} className="bg-white hover:bg-slate-50 transition-colors duration-200 cursor-default border-b border-slate-100">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                    {cliente.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="font-medium text-gray-900">{cliente.nombre}</div>
                                                    {cliente.notasPreferencias && (
                                                        <div className="text-xs text-orange-600 mt-0.5 truncate max-w-[150px]" title={cliente.notasPreferencias}>
                                                            ★ Tiene notas guardadas
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-gray-900 text-sm font-medium">
                                                {cliente.telefono || <span className="text-slate-300 font-normal">Sin teléfono</span>}
                                            </div>
                                            <div className="text-slate-400 text-xs mt-0.5">
                                                {cliente.email || <span className="text-slate-300">Sin email</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {format(new Date(cliente.createdAt), "d MMM, yyyy", { locale: es })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {cliente._count?.turnos || 0} Turnos
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleOpenEditModal(cliente)}
                                                    className="text-slate-400 hover:text-slate-800 transition-colors p-2 rounded-lg inline-flex items-center"
                                                    title="Editar cliente"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenDeleteModal(cliente)}
                                                    className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg inline-flex items-center"
                                                    title="Eliminar cliente"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <Link href={`/dashboard/clientes/${cliente.id}`} className="text-slate-400 hover:text-slate-800 transition-colors p-2 rounded-lg inline-flex items-center">
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Client Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={handleCloseEditModal}></div>
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h3 className="text-lg font-semibold text-slate-900">Editar Cliente</h3>
                            <button onClick={handleCloseEditModal} className="text-slate-400 hover:text-slate-800 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-sm">
                            {formError && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                                    {formError}
                                </div>
                            )}
                            {formSuccess && (
                                <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm border border-green-100">
                                    Cliente actualizado exitosamente.
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Nombre completo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white transition-shadow"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    disabled={formLoading}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                                <input
                                    type="tel"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white transition-shadow"
                                    value={formData.telefono}
                                    onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                    disabled={formLoading}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white transition-shadow"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    disabled={formLoading}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Notas de Preferencias</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white transition-shadow resize-none"
                                    rows={3}
                                    placeholder="Preferencias de corte, bebidas, etc..."
                                    value={formData.notasPreferencias}
                                    onChange={e => setFormData({ ...formData, notasPreferencias: e.target.value })}
                                    disabled={formLoading}
                                ></textarea>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseEditModal}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium rounded-lg transition-colors border border-transparent"
                                    disabled={formLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading || formSuccess}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {formLoading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Client Confirmation */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar cliente?"
                message={`¿Estás seguro de que deseas eliminar a ${clienteToDelete?.nombre}? Esta acción no se puede deshacer.`}
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                type="danger"
                loading={deleteLoading}
            />
        </div>
    );
}
