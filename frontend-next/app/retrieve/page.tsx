import type { Metadata } from 'next';
import RetrieveContent from '@/components/features/retrieve/RetrieveContent';

export const metadata: Metadata = {
    title: 'Retrieve Shared Files & Text — Enter Your Code',
    description:
        'Enter a 4-digit ShareVault code to instantly open text or download files shared with you. No signup required.',
    alternates: { canonical: 'https://sharevault.vercel.app/retrieve' },
    openGraph: {
        url: 'https://sharevault.vercel.app/retrieve',
        title: 'Retrieve Shared Files & Text — Enter Your Code | ShareVault',
        description:
            'Enter a 4-digit ShareVault code to instantly open text or download files shared with you. No signup required.',
    },
};

export default function RetrievePage() {
    return <RetrieveContent />;
}
