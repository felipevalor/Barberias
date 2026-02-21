'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function HorariosPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { token } = useAuth();
    const [horarios, setHorarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Inicializar estructura de días
    useEffect(() => {
        // Si estuviéramos obteniendo el horario existente del barbero, lo cargaríamos aquí.
        // Por simplicidad en este MVP, iniciamos con un esquema vacío basado en L-V.
        const initialConfig = [1, 2, 3, 4, 5].map(dia => ({
            diaSemana: dia,
            activo: true,
            horaInicio: '09:00',
            horaFin: '18:00',
            descansos: [{ horaInicio: '13:00', horaFin: '14:00' }]
        }));

        // Añadimos sábado y domingo inactivos por defecto
        initialConfig.push(
            { diaSemana: 6, activo: false, horaInicio: '09:00', horaFin: '14:00', descansos: [] },
            { diaSemana: 0, activo: false, horaInicio: '10:00', horaFin: '14:00', descansos: [] }
        );

        setHorarios(initialConfig.sort((a, b) => a.diaSemana - b.diaSemana));
        setLoading(false);
    }, []);

    const handleToggleDia = (index: number) => {
        const newHorarios = [...horarios];
        newHorarios[index].activo = !newHorarios[index].activo;
        setHorarios(newHorarios);
    };

    const handleChangeTime = (index: number, field: string, value: string) => {
        const newHorarios = [...horarios];
        newHorarios[index][field] = value;
        setHorarios(newHorarios);
    };

    const handleAddDescanso = (diaIndex: number) => {
        const newHorarios = [...horarios];
        newHorarios[diaIndex].descansos.push({ horaInicio: '12:00', horaFin: '13:00' });
        setHorarios(newHorarios);
    };

    const handleRemoveDescanso = (diaIndex: number, descansoIndex: number) => {
        const newHorarios = [...horarios];
        newHorarios[diaIndex].descansos.splice(descansoIndex, 1);
        setHorarios(newHorarios);
    };

    const handleChangeDescanso = (diaIndex: number, descansoIndex: number, field: string, value: string) => {
        const newHorarios = [...horarios];
        newHorarios[diaIndex].descansos[descansoIndex][field] = value;
        setHorarios(newHorarios);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');

        try {
            // Filtrar sólo los días activos
            const payload = horarios
                .filter(h => h.activo)
                .map(({ activo, ...rest }) => rest);

            const res = await fetch(`http://localhost:3001/api/staff/${id}/horarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ horarios: payload })
            });

            if (!res.ok) throw new Error('Error al guardar los horarios');

            router.push('/dashboard/staff');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center">
                    <Link href="/dashboard/staff" className="mr-4 text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configurar Horario Laboral</h2>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-600 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {horarios.map((horario, index) => (
                    <div
                        key={horario.diaSemana}
                        className={`p-5 rounded-xl border ${horario.activo ? 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-900/50 shadow-sm' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-750 opacity-75'}`}
                    >
                        <div className="flex items-center mb-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={horario.activo}
                                    onChange={() => handleToggleDia(index)}
                                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className={`ml-3 text-lg font-medium ${horario.activo ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {DIAS[horario.diaSemana]}
                                </span>
                            </label>
                        </div>

                        {horario.activo && (
                            <div className="pl-8 space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div>
                                        <span className="block text-xs text-gray-500 uppercase font-semibold mb-1">Entrada</span>
                                        <input
                                            type="time"
                                            value={horario.horaInicio}
                                            onChange={(e) => handleChangeTime(index, 'horaInicio', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <span className="text-gray-400 pt-5">-</span>
                                    <div>
                                        <span className="block text-xs text-gray-500 uppercase font-semibold mb-1">Salida</span>
                                        <input
                                            type="time"
                                            value={horario.horaFin}
                                            onChange={(e) => handleChangeTime(index, 'horaFin', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Descansos (Almuerzo)</span>
                                        <button
                                            onClick={() => handleAddDescanso(index)}
                                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Añadir pausa
                                        </button>
                                    </div>

                                    {horario.descansos.length === 0 ? (
                                        <p className="text-xs text-gray-500 italic">Sin descansos configurados</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {horario.descansos.map((descanso: any, dIndex: number) => (
                                                <div key={dIndex} className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg inline-flex">
                                                    <input
                                                        type="time"
                                                        value={descanso.horaInicio}
                                                        onChange={(e) => handleChangeDescanso(index, dIndex, 'horaInicio', e.target.value)}
                                                        className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                                    />
                                                    <span className="text-gray-400">a</span>
                                                    <input
                                                        type="time"
                                                        value={descanso.horaFin}
                                                        onChange={(e) => handleChangeDescanso(index, dIndex, 'horaFin', e.target.value)}
                                                        className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveDescanso(index, dIndex)}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
