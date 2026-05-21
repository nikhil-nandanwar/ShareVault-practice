import type { MetadataRoute } from 'next';

const SITE_URL = 'https://sharevault.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();
    return [
        {
            url: `${SITE_URL}/`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${SITE_URL}/file-upload`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/retrieve`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
    ];
}
