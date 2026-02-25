import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://state244.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/', '/chat/', '/settings/', '/war-plan/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
