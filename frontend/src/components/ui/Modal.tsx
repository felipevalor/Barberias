'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    className?: string;
    showCloseButton?: boolean;
}

const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-[95vw]',
};

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidth = 'md',
    className,
    showCloseButton = true,
}: ModalProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [isAnimateIn, setIsAnimateIn] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            document.body.style.overflow = 'hidden';
            // Trigger animation in next tick
            setTimeout(() => setIsAnimateIn(true), 10);
        } else {
            setIsAnimateIn(false);
            const timeout = setTimeout(() => {
                setIsMounted(false);
                document.body.style.overflow = 'unset';
            }, 300); // Wait for transition
            return () => {
                clearTimeout(timeout);
                document.body.style.overflow = 'unset';
            };
        }
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isMounted) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out",
                isAnimateIn ? "opacity-100" : "opacity-0"
            )}
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className={cn(
                    "relative bg-white rounded-[28px] shadow-2xl w-full border border-slate-100 flex flex-col transition-all duration-300 ease-out transform",
                    maxWidthClasses[maxWidth],
                    isAnimateIn ? "translate-y-0 scale-100" : "translate-y-8 scale-95",
                    className
                )}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex justify-between items-center p-6 pb-2">
                        <div className="flex-1">
                            {title && (
                                <h3 className="text-xl font-bold text-slate-900">
                                    {title}
                                </h3>
                            )}
                        </div>
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-900 transition-all rounded-xl hover:bg-slate-50 p-2"
                                aria-label="Cerrar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[85vh] scrollbar-hide">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-6 pt-2 border-t border-slate-50 flex items-center gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
