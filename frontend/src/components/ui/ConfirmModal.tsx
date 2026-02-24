'use client';

import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertCircle, HelpCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: ConfirmType;
    loading?: boolean;
}

const typeConfig = {
    danger: {
        icon: AlertTriangle,
        iconClass: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        buttonVariant: 'primary' as const, // We'll style it specifically if needed
        buttonClass: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
    },
    warning: {
        icon: HelpCircle,
        iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        buttonVariant: 'primary' as const,
        buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600',
    },
    info: {
        icon: HelpCircle,
        iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        buttonVariant: 'primary' as const,
        buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    },
    success: {
        icon: CheckCircle2,
        iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        buttonVariant: 'primary' as const,
        buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600',
    }
};

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'info',
    loading = false
}: ConfirmModalProps) {
    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false}
            maxWidth="sm"
            className="rounded-[32px]"
        >
            <div className="flex flex-col items-center text-center py-4">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", config.iconClass)}>
                    <Icon className="w-8 h-8" />
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                    {title}
                </h3>

                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[280px]">
                    {message}
                </p>

                <div className="grid grid-cols-1 w-full gap-3 mt-10">
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={cn(
                            "w-full py-4 rounded-2xl text-sm font-bold shadow-xl transition-all active:scale-[0.98] hover:scale-[1.02] flex items-center justify-center",
                            config.buttonClass,
                            loading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            confirmText
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-full py-4 rounded-2xl text-sm font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
