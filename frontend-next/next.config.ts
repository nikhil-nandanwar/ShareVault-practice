import type { NextConfig } from 'next';

// Rewrites are only registered when BACKEND_URL is provided. We deliberately
// do NOT fall back to localhost in production — a localhost rewrite on Vercel
// is unreachable and would surface as a confusing 404.
//
// Two valid configurations (set ONE in Vercel env):
//   - BACKEND_URL=https://your-backend.example.com  → proxy via this file
//   - NEXT_PUBLIC_BACKEND_URL=https://...           → client calls direct
//
// In local dev, set BACKEND_URL in .env.local to use the proxy.
const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, '');

if (!backendUrl && !process.env.NEXT_PUBLIC_BACKEND_URL) {
    console.warn(
        '[next.config] Neither BACKEND_URL nor NEXT_PUBLIC_BACKEND_URL is set — ' +
            'API calls will 404 in production. Set one of them in Vercel env vars.',
    );
}

const nextConfig: NextConfig = {
    async rewrites() {
        if (!backendUrl) return [];
        return [
            {
                source: '/api/:path*',
                destination: `${backendUrl}/api/:path*`,
            },
            {
                source: '/uploads/:path*',
                destination: `${backendUrl}/uploads/:path*`,
            },
        ];
    },
};

export default nextConfig;
