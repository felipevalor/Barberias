'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, Users, Calendar, Settings, LogOut, Scissors, UserCircle, Menu, X, DollarSign, Package, FileBarChart } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['ADMIN', 'SUPERADMIN', 'BARBERO'] },
        { name: 'Agenda', href: '/dashboard/agenda', icon: Calendar, roles: ['ADMIN', 'SUPERADMIN', 'BARBERO'] },
        { name: 'Staff', href: '/dashboard/staff', icon: Users, roles: ['ADMIN', 'SUPERADMIN'] },
        { name: 'Servicios', href: '/dashboard/servicios', icon: Scissors, roles: ['ADMIN', 'SUPERADMIN'] },
        { name: 'Clientes', href: '/dashboard/clientes', icon: UserCircle, roles: ['ADMIN', 'SUPERADMIN', 'BARBERO'] },
        { name: 'Productos', href: '/dashboard/productos', icon: Package, roles: ['ADMIN', 'SUPERADMIN', 'BARBERO'] },
        { name: 'Caja', href: '/dashboard/caja', icon: DollarSign, roles: ['ADMIN', 'SUPERADMIN'] },
        { name: 'Reportes', href: '/dashboard/reportes', icon: FileBarChart, roles: ['ADMIN', 'SUPERADMIN'] },
        { name: 'Ajustes', href: '/dashboard/settings', icon: Settings, roles: ['ADMIN', 'SUPERADMIN'] },
    ];

    if (!user) return null;

    return (
        <div className="flex flex-col w-64 bg-white border-r border-slate-100 text-slate-900 min-h-screen pt-5 pb-4 shadow-sm">
            <div className="flex items-center flex-shrink-0 px-6 font-black text-2xl tracking-tight mb-8 text-slate-900">
                SaaS Barber
            </div>
            <div className="mt-5 flex-grow flex flex-col">
                <nav className="flex-1 px-4 space-y-2 bg-white" aria-label="Sidebar">
                    {navigation.map((item) => {
                        const isActive = pathname.startsWith(item.href) &&
                            (item.href === '/dashboard' ? pathname === '/dashboard' : true);

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    group flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all
                                    ${isActive
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-[1.02]'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }
                                `}
                            >
                                <item.icon
                                    className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}
                                    aria-hidden="true"
                                />
                                <span className="truncate">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-slate-50 p-4">
                <button
                    onClick={logout}
                    className="flex-shrink-0 w-full group block bg-slate-50 rounded-2xl p-4 hover:bg-red-50 transition-all border border-slate-100 hover:border-red-100"
                >
                    <div className="flex items-center">
                        <LogOut className="inline-block h-5 w-5 text-slate-400 group-hover:text-red-500 mr-3 transition-colors" />
                        <div className="text-sm font-bold text-slate-600 group-hover:text-red-600 transition-colors">
                            Cerrar Sesión
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}
