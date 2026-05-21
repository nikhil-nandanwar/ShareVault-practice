import type { Metadata } from 'next';
import TextUploadSection from '@/components/features/text-upload/TextUploadSection';

export const metadata: Metadata = {
    title: 'Share Text Instantly with a 4-digit Code',
    description:
        'Paste any text snippet, note, or link and get a 4-digit sharing code in seconds. Open it from any device — no signup required.',
    alternates: { canonical: 'https://sharevault.vercel.app/' },
    openGraph: {
        url: 'https://sharevault.vercel.app/',
        title: 'Share Text Instantly with a 4-digit Code | ShareVault',
        description:
            'Paste any text snippet, note, or link and get a 4-digit sharing code in seconds. Open it from any device — no signup required.',
    },
};

export default function HomePage() {
    return <TextUploadSection />;
}
