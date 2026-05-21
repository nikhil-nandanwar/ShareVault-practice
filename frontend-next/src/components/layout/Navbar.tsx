'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { VIEWS } from '@/constants/views';
import Logo from './Logo';

function isActive(pathname: string, href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
}

function Navbar() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link
                    href="/"
                    aria-label="ShareVault home"
                    className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                >
                    <Logo />
                </Link>

                <nav
                    aria-label="Primary"
                    className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 p-1 shadow-sm"
                >
                    {VIEWS.map((view) => {
                        const active = isActive(pathname ?? '/', view.href);
                        return (
                            <Link
                                key={view.id}
                                href={view.href}
                                aria-current={active ? 'page' : undefined}
                                className={[
                                    'relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
                                    active
                                        ? 'text-slate-900'
                                        : 'text-slate-500 hover:text-slate-800',
                                ].join(' ')}
                            >
                                {active && (
                                    <span
                                        className="absolute inset-0 rounded-full bg-white shadow-sm ring-1 ring-slate-200"
                                        aria-hidden="true"
                                    />
                                )}
                                <span className="relative inline-flex items-center gap-1.5">
                                    <view.icon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{view.label}</span>
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}

export default Navbar;
