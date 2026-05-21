import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    invalid?: boolean;
}

function Input({ className = '', type = 'text', invalid = false, ...props }: InputProps) {
    return (
        <input
            type={type}
            className={[
                'h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-4 focus:ring-indigo-500/15',
                invalid
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-200 focus:border-indigo-500',
                className,
            ].join(' ')}
            {...props}
        />
    );
}

export default Input;
