'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (isMounted && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isMounted, router]);

    if (!isMounted || !isAuthenticated) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Cargando...</div>;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex flex-col w-0 flex-1 overflow-hidden">
                <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
                    <div className="py-6 px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {user?.nombre}</h1>
                            <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                                Rol: <span className="font-semibold text-blue-600">{user?.role}</span>
                            </div>
                        </div>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
