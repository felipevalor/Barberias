import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, DollarSign, Wallet, PackagePlus, Trash2 } from 'lucide-react';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    turno: any;
    onSuccess: () => void;
}

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
            fetch('http://localhost:3001/api/pos/metodos', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => {
                    setMetodos(data);
                    if (data.length > 0) setSelectedMetodo(data[0].id);
                })
                .catch(console.error);

            // Fetch Products
            fetch('http://localhost:3001/api/productos', { headers: { Authorization: `Bearer ${token}` } })
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
            // 1. Cobrar el turno
            const res = await fetch(`http://localhost:3001/api/pos/checkout/${turno.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    metodoPagoId: selectedMetodo,
                    montoCobrado: montoBase,
                    propina: Number(propina)
                })
            });

            if (!res.ok) throw new Error(await res.text());

            // 2. Cobrar productos (si hay)
            if (selectedProductos.length > 0) {
                for (const prod of selectedProductos) {
                    await fetch(`http://localhost:3001/api/productos/${prod.id}/vender`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ cantidad: prod.cantidad, metodoPagoId: selectedMetodo })
                    });
                }
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al procesar el pago o artículos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                        Checkout del Turno
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

                    {/* Resumen */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cliente</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{turno.cliente?.nombre || 'General'}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Servicio</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{turno.servicio?.nombre}</span>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Precio Base</span>
                            <span className="font-bold text-gray-900 dark:text-white">${montoBase}</span>
                        </div>
                    </div>

                    {/* Formulario de Pago y Propinas */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <Wallet className="w-4 h-4 mr-2" /> Método de Pago
                            </label>
                            <select
                                value={selectedMetodo}
                                onChange={(e) => setSelectedMetodo(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                                {metodos.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Propina (Opcional)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={propina || ''}
                                        onChange={(e) => setPropina(Number(e.target.value))}
                                        className="w-full pl-8 p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Agregar Producto
                                </label>
                                <select
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const p = productos.find(x => x.id === e.target.value);
                                            if (p) addProducto(p);
                                            e.target.value = ''; // reset
                                        }
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Seleccionar...</option>
                                    {productos.map(p => (
                                        <option key={p.id} value={p.id} disabled={p.stockActual <= 0}>
                                            {p.nombre} (${p.precioVenta}) {p.stockActual <= 0 ? '- Sin Stock' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Productos Agregados */}
                    {selectedProductos.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3">
                            <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2 flex items-center">
                                <PackagePlus className="w-3 h-3 mr-1" /> Productos Adicionales
                            </h4>
                            <div className="space-y-2">
                                {selectedProductos.map(p => (
                                    <div key={p.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-lg text-sm">
                                        <div className="flex items-center">
                                            <span className="font-semibold text-gray-900 dark:text-white mr-2">{p.cantidad}x</span>
                                            <span className="text-gray-600 dark:text-gray-300">{p.nombre}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-bold text-gray-900 dark:text-white mr-3">${p.precio * p.cantidad}</span>
                                            <button onClick={() => removeProducto(p.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Total */}
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl flex justify-between items-center mt-6">
                        <span className="font-bold text-blue-900 dark:text-blue-200">Total a Cobrar</span>
                        <span className="text-2xl font-black text-blue-700 dark:text-blue-400">${total}</span>
                    </div>

                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
                    <button onClick={onClose} disabled={loading} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition">
                        Cancelar
                    </button>
                    <button onClick={handleCheckout} disabled={loading || !selectedMetodo} className="w-full sm:w-auto px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 transition">
                        {loading ? 'Procesando...' : 'Confirmar Pago'}
                    </button>
                </div>
            </div>
        </div>
    );
}
