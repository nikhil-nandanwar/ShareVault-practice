import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/layout/Hero';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
    variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    weight: ['500', '700'],
    display: 'swap',
    variable: '--font-jetbrains',
});

const SITE_URL = 'https://sharevault.vercel.app/';
const LOGO_URL = 'https://sharevault.vercel.app/src/assets/logo.png';
const TITLE = 'ShareVault - Share Text & Files Instantly with a Code | Free Online File Sharing';
const SHORT_TITLE = 'ShareVault - Share Text & Files Instantly with a Code';
const DESCRIPTION =
    'ShareVault is a free, fast and secure online tool to share text snippets and files with a unique code. Send notes, documents, images and files instantly across devices - no signup required.';
const OG_DESCRIPTION =
    'Free, fast and secure online tool to share text and files with a unique code. Transfer notes, documents and files across devices instantly - no signup required.';

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: TITLE,
        template: '%s | ShareVault',
    },
    description: DESCRIPTION,
    applicationName: 'ShareVault',
    authors: [{ name: 'ShareVault' }],
    keywords: [
        'ShareVault',
        'share text online',
        'share files online',
        'file sharing',
        'text sharing',
        'send files with code',
        'share code',
        'online clipboard',
        'instant file transfer',
        'anonymous file sharing',
        'secure file sharing',
        'share notes online',
        'cross device file share',
        'free file sharing',
        'paste text online',
        'send text with code',
        'transfer files',
        'share documents online',
        'no signup file sharing',
    ],
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true },
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
    } as Metadata['robots'],
    referrer: 'strict-origin-when-cross-origin',
    formatDetection: { telephone: false },
    alternates: { canonical: SITE_URL },
    manifest: '/site.webmanifest',
    icons: {
        icon: '/src/assets/logo.png',
        shortcut: '/src/assets/logo.png',
        apple: '/src/assets/logo.png',
    },
    openGraph: {
        type: 'website',
        siteName: 'ShareVault',
        url: SITE_URL,
        title: SHORT_TITLE,
        description: OG_DESCRIPTION,
        locale: 'en_US',
        images: [
            {
                url: LOGO_URL,
                width: 1200,
                height: 630,
                alt: 'ShareVault - Share text and files instantly with a unique code',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: SHORT_TITLE,
        description: OG_DESCRIPTION,
        images: [
            {
                url: LOGO_URL,
                alt: 'ShareVault - Share text and files instantly with a unique code',
            },
        ],
    },
    appleWebApp: {
        capable: true,
        title: 'ShareVault',
        statusBarStyle: 'default',
    },
    other: {
        'mobile-web-app-capable': 'yes',
        bingbot: 'index, follow',
        language: 'English',
        'revisit-after': '7 days',
        rating: 'general',
        distribution: 'global',
        'twitter:url': SITE_URL,
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#6366f1',
};

const webApplicationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ShareVault',
    url: SITE_URL,
    description: DESCRIPTION,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: [
        'Share text instantly with a unique code',
        'Upload and share files securely',
        'Retrieve content from any device using a code',
        'No signup or registration required',
        'Fast and lightweight',
    ],
    aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '120',
        bestRating: '5',
        worstRating: '1',
    },
};

const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ShareVault',
    url: SITE_URL,
    logo: LOGO_URL,
    description:
        'ShareVault provides a free, secure way to share text and files online using a unique sharing code.',
};

const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ShareVault',
    url: SITE_URL,
    potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}?code={search_term_string}`,
        'query-input': 'required name=search_term_string',
    },
};

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'What is ShareVault?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'ShareVault is a free online tool that lets you share text and files instantly using a unique code. Anyone with the code can retrieve your content from any device.',
            },
        },
        {
            '@type': 'Question',
            name: 'Do I need an account to use ShareVault?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. ShareVault works without any signup or registration. Just paste your text or upload your file, get a code, and share it.',
            },
        },
        {
            '@type': 'Question',
            name: 'Is ShareVault free to use?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, ShareVault is completely free to use for sharing text and files online.',
            },
        },
        {
            '@type': 'Question',
            name: 'How do I retrieve shared content?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Click the Retrieve tab and enter the unique code that was generated when the content was shared. Your text or file will be available instantly.',
            },
        },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
            <body>
                <div className="app-backdrop flex min-h-screen flex-col">
                    <Navbar />
                    <Hero />
                    <PageContainer className="flex-1 pb-16">{children}</PageContainer>
                    <Footer />
                </div>
                <Script
                    id="ld-web-application"
                    type="application/ld+json"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
                />
                <Script
                    id="ld-organization"
                    type="application/ld+json"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
                />
                <Script
                    id="ld-website"
                    type="application/ld+json"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
                />
                <Script
                    id="ld-faq"
                    type="application/ld+json"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
                />
                <noscript>
                    <h2>ShareVault - Share Text and Files Instantly with a Code</h2>
                    <p>
                        ShareVault is a free, fast and secure online tool to share text snippets
                        and files using a unique sharing code. No signup required. Please enable
                        JavaScript to use ShareVault.
                    </p>
                </noscript>
            </body>
        </html>
    );
}
