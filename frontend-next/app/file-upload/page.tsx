import type { Metadata } from 'next';
import FileUploadSection from '@/components/features/file-upload/FileUploadSection';

export const metadata: Metadata = {
    title: 'Share Files with a 4-digit Code',
    description:
        'Upload images, documents, audio, video or archives and share them with anyone using a single 4-digit code. Free, fast, no signup.',
    alternates: { canonical: 'https://sharevault.vercel.app/file-upload' },
    openGraph: {
        url: 'https://sharevault.vercel.app/file-upload',
        title: 'Share Files with a 4-digit Code | ShareVault',
        description:
            'Upload images, documents, audio, video or archives and share them with anyone using a single 4-digit code. Free, fast, no signup.',
    },
};

export default function FileUploadPage() {
    return <FileUploadSection />;
}
