import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type AlertVariant = 'error' | 'info' | 'success';

const VARIANTS: Record<AlertVariant, { wrapper: string; iconColor: string; icon: IconName }> = {
    error: {
        wrapper: 'border-rose-200 bg-rose-50 text-rose-800',
        iconColor: 'text-rose-500',
        icon: 'alert',
    },
    info: {
        wrapper: 'border-indigo-200 bg-indigo-50 text-indigo-800',
        iconColor: 'text-indigo-500',
        icon: 'info',
    },
    success: {
        wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        iconColor: 'text-emerald-500',
        icon: 'check',
    },
};

export interface AlertProps {
    variant?: AlertVariant;
    children?: ReactNode;
    className?: string;
}

function Alert({ variant = 'error', children, className = '' }: AlertProps) {
    const v = VARIANTS[variant];

    return (
        <div
            role="alert"
            className={[
                'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
                v.wrapper,
                className,
            ].join(' ')}
        >
            <Icon name={v.icon} className={['mt-0.5 h-4 w-4 shrink-0', v.iconColor].join(' ')} />
            <div className="leading-relaxed">{children}</div>
        </div>
    );
}

export default Alert;
