'use client';

import {
    useEffect,
    useRef,
    type ClipboardEvent,
    type KeyboardEvent,
} from 'react';

export const CODE_LENGTH = 4;

export interface CodeInputProps {
    value: string;
    onChange: (value: string) => void;
    autoFocus?: boolean;
    disabled?: boolean;
}

function CodeInput({ value, onChange, autoFocus = true, disabled = false }: CodeInputProps) {
    const LENGTH = CODE_LENGTH;
    const inputs = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        if (autoFocus) inputs.current[0]?.focus();
    }, [autoFocus]);

    const buildValue = (digits: Array<string | undefined>) =>
        Array.from({ length: LENGTH }, (_, i) => digits[i] ?? '')
            .join('')
            .replace(/\s+$/, '');

    const setDigit = (index: number, digit: string) => {
        const next = Array.from({ length: LENGTH }, (_, i) => value[i] ?? '');
        next[index] = digit;
        onChange(buildValue(next));
    };

    const focusInput = (index: number) => {
        const el = inputs.current[Math.max(0, Math.min(index, LENGTH - 1))];
        el?.focus();
        el?.select();
    };

    const fillFrom = (startIndex: number, digits: string) => {
        if (!digits) return;
        const next = Array.from({ length: LENGTH }, (_, i) => value[i] ?? '');
        let i = startIndex;
        for (const ch of digits) {
            if (i >= LENGTH) break;
            next[i] = ch;
            i += 1;
        }
        onChange(buildValue(next));
        focusInput(i);
    };

    const handleChange = (index: number, raw: string) => {
        const digits = raw.replace(/\D/g, '');
        if (!digits) return;
        if (digits.length > 1) {
            fillFrom(index, digits.slice(0, LENGTH - index));
            return;
        }
        setDigit(index, digits);
        if (index < LENGTH - 1) inputs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (value[index]) {
                setDigit(index, '');
            } else if (index > 0) {
                inputs.current[index - 1]?.focus();
                const next = Array.from({ length: LENGTH }, (_, i) => value[i] ?? '');
                next[index - 1] = '';
                onChange(buildValue(next));
            }
        }
        if (e.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
        if (e.key === 'ArrowRight' && index < LENGTH - 1) inputs.current[index + 1]?.focus();
    };

    const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH - index);
        if (!pasted) return;
        fillFrom(index, pasted);
    };

    return (
        <div className="flex justify-center gap-2 sm:gap-3">
            {Array.from({ length: LENGTH }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => {
                        inputs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={LENGTH}
                    disabled={disabled}
                    value={value[i] ?? ''}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={(e) => handlePaste(i, e)}
                    onFocus={(e) => e.target.select()}
                    aria-label={`Digit ${i + 1}`}
                    className={[
                        'h-16 w-14 rounded-xl border bg-white text-center font-mono text-3xl font-bold text-slate-900',
                        'transition-colors duration-150',
                        'focus:outline-none focus:ring-4 focus:ring-indigo-500/15',
                        value[i]
                            ? 'border-indigo-400 focus:border-indigo-500'
                            : 'border-slate-200 focus:border-indigo-500',
                        'sm:h-20 sm:w-16 sm:text-4xl',
                    ].join(' ')}
                />
            ))}
        </div>
    );
}

export default CodeInput;
