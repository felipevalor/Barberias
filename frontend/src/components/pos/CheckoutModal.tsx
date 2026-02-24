'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, DollarSign, Wallet, PackagePlus, Trash2, ShoppingBag, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    turno: any;
    onSuccess: () => void;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function CheckoutModal({ isOpen, onClose, turno, onSuccess }: CheckoutModalProps) {
    const { token } = useAuth();
    const [metodos, setMetodos] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    const [selectedMetodo, setSelectedMetodo] = useState<string>('');
    const [propina, setPropina] = useState<number>(0);
    const [selectedProductos, setSelectedProductos] = useState<{ id: string, nombre: string, precio: number, cantidad: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && token) {
            // Fetch Payment Methods
            fetch(`${API}/pos/metodos`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => {
                    setMetodos(data);
                    if (data.length > 0) setSelectedMetodo(data[0].id);
                })
                .catch(console.error);

            // Fetch Products
            fetch(`${API}/productos`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => setProductos(data))
                .catch(console.error);
        }
    }, [isOpen, token]);

    // Cleanup state on close
    useEffect(() => {
        if (!isOpen) {
            setPropina(0);
            setSelectedProductos([]);
            setError('');
        }
    }, [isOpen]);

    if (!isOpen || !turno) return null;

    const montoBase = turno.servicio?.precio || 0;
    const montoProductos = selectedProductos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
    const total = montoBase + Number(propina) + montoProductos;

    const addProducto = (prod: any) => {
        const index = selectedProductos.findIndex(p => p.id === prod.id);
        if (index >= 0) {
            const newProds = [...selectedProductos];
            newProds[index].cantidad += 1;
            setSelectedProductos(newProds);
        } else {
            setSelectedProductos([...selectedProductos, { id: prod.id, nombre: prod.nombre, precio: prod.precioVenta, cantidad: 1 }]);
        }
    };

    const removeProducto = (id: string) => {
        setSelectedProductos(selectedProductos.filter(p => p.id !== id));
    };

    const handleCheckout = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/pos/checkout/${turno.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    metodoPagoId: selectedMetodo,
                    montoCobrado: montoBase,
                    propina: Number(propina),
                    productos: selectedProductos.map(p => ({
                        id: p.id,
                        cantidad: p.cantidad
                    }))
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Error al procesar el pago');
            }

            toast.success('¡Cobro realizado con éxito!');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title">
            <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-green-600 to-emerald-700">
                    <h3 id="checkout-modal-title" className="text-xl font-black text-white flex items-center tracking-tight">
                        <DollarSign className="w-6 h-6 mr-2" />
                        Finalizar Cobro
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1" aria-label="Cerrar modal">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
                    {error && (
                        <div className="p-4 text-sm font-semibold text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Transaction Summary */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Resumen de Venta</span>
                            <div className="flex items-center text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                                <ShoppingBag className="w-3 h-3 mr-1.5" />
                                {turno.cliente?.nombre || 'Consumidor Final'}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Servicio: {turno.servicio?.nombre}</span>
                                <span className="font-bold text-gray-900 dark:text-white">${montoBase}</span>
                            </div>
                            {Number(propina) > 0 && (
                                <div className="flex justify-between items-center text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                                    <span>Propina</span>
                                    <span>+${propina}</span>
                                </div>
                            )}
                            {montoProductos > 0 && (
                                <div className="flex justify-between items-center text-sm text-blue-600 dark:text-blue-400 font-bold">
                                    <span>Productos ({selectedProductos.length})</span>
                                    <span>+${montoProductos}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment & Products Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                                <CreditCard className="w-3.5 h-3.5 mr-2 text-blue-500" /> Método de Pago
                            </label>
                            <select
                                value={selectedMetodo}
                                onChange={(e) => setSelectedMetodo(e.target.value)}
                                className="w-full p-3.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-bold text-sm"
                            >
                                {metodos.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Propina"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={propina || ''}
                            onChange={(e) => setPropina(Number(e.target.value))}
                            leftIcon={<span className="text-emerald-500 font-bold">$</span>}
                            className="font-bold"
                        />
                    </div>

                    {/* Product Selection */}
                    <div className="space-y-3">
                        <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center">
                            <PackagePlus className="w-3.5 h-3.5 mr-2 text-amber-500" /> Productos Adicionales
                        </label>
                        <select
                            className="w-full p-3.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm font-medium"
                            onChange={(e) => {
                                if (e.target.value) {
                                    const p = productos.find(x => x.id === e.target.value);
                                    if (p) addProducto(p);
                                    e.target.value = ''; // reset
                                }
                            }}
                            defaultValue=""
                        >
                            <option value="" disabled>Buscar producto...</option>
                            {productos.map(p => (
                                <option key={p.id} value={p.id} disabled={p.stockActual <= 0}>
                                    {p.nombre} — ${p.precioVenta} {p.stockActual <= 0 ? '(Sin stock)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Selected Products List */}
                    {selectedProductos.length > 0 && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            {selectedProductos.map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center font-black text-xs text-blue-600 dark:text-blue-400 mr-3 border border-gray-100 dark:border-gray-700">
                                            {p.cantidad}x
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{p.nombre}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-sm font-black text-gray-900 dark:text-white mr-4">${p.precio * p.cantidad}</span>
                                        <button
                                            onClick={() => removeProducto(p.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            title="Quitar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Final Total */}
                    <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Wallet className="w-24 h-24 text-white" />
                        </div>
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-black text-white/70 uppercase tracking-widest block mb-1">Total a Cobrar</span>
                                <span className="text-3xl font-black text-white tracking-tighter">${total}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest block mb-1">Método</span>
                                <span className="text-xs font-bold text-white bg-white/20 px-2 py-1 rounded-md">
                                    {metodos.find(m => m.id === selectedMetodo)?.nombre || 'Seleccione...'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 flex flex-col-reverse sm:flex-row justify-end space-y-3 space-y-reverse sm:space-y-0 sm:space-x-4">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-full sm:w-auto px-6 py-3 text-gray-600 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-widest text-xs"
                    >
                        Cancelar
                    </button>
                    <Button
                        onClick={handleCheckout}
                        isLoading={loading}
                        disabled={!selectedMetodo}
                        className="w-full sm:w-auto h-12 px-8 uppercase tracking-widest text-xs"
                    >
                        Confirmar Pago
                    </Button>
                </div>
            </div>
        </div>
    );
}
