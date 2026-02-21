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
        <div className="flex flex-col w-64 bg-gray-900 border-r border-gray-800 text-white min-h-screen pt-5 pb-4">
            <div className="flex items-center flex-shrink-0 px-6 font-bold text-xl tracking-wider mb-8">
                SaaS Barber
            </div>
            <div className="mt-5 flex-grow flex flex-col">
                <nav className="flex-1 px-4 space-y-2 bg-gray-900" aria-label="Sidebar">
                    {navigation.map((item) => {
                        const isActive = pathname.startsWith(item.href) &&
                            (item.href === '/dashboard' ? pathname === '/dashboard' : true);

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                  group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }
                `}
                            >
                                <item.icon
                                    className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}
                                    aria-hidden="true"
                                />
                                <span className="truncate">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
                <button
                    onClick={logout}
                    className="flex-shrink-0 w-full group block bg-gray-800 rounded-lg p-3 hover:bg-red-600 transition-colors"
                >
                    <div className="flex items-center">
                        <LogOut className="inline-block h-5 w-5 text-gray-400 group-hover:text-white mr-3" />
                        <div className="text-sm font-medium text-gray-300 group-hover:text-white">
                            Cerrar Sesión
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}
