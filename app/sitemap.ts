import type { MetadataRoute } from 'next'

const BASE_URL = 'https://grandpro.kz'
const locales = ['ru', 'kz', 'en'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${BASE_URL}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: locale === 'ru' ? 1.0 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${BASE_URL}/${l}`])
      ),
    },
  }))
}
