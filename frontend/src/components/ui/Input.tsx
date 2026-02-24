'use client';

import { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
    leftIcon?: ReactNode;
}

export default function Input({
    label,
    error,
    leftIcon,
    className = '',
    containerClassName = '',
    id,
    ...props
}: InputProps) {
    const inputId = id || props.name;

    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={`
            appearance-none block w-full 
            ${leftIcon ? 'pl-10 mr-3.5' : 'px-3.5'} py-2.5 
            border rounded-lg shadow-sm
            placeholder-gray-400
            transition-all duration-200
            focus:outline-none focus:ring-2
            sm:text-sm
            ${error
                            ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-800 dark:bg-red-900/10'
                            : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500'
                        }
            ${className}
          `}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" id={`${inputId}-error`}>
                    {error}
                </p>
            )}
        </div>
    );
}
