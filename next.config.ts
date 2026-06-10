import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

const isDev = process.env.NODE_ENV === 'development'

// 'unsafe-inline' in script-src is required for Next.js App Router hydration scripts
// and the JSON-LD <script> tag in layout.tsx. Acceptable for a public landing page
// with no user-generated content. Upgrade to nonce-based CSP if auth is ever added.
// 'unsafe-eval' is only added in development — React dev mode needs it for stack traces.
const CSP = [
  "default-src 'self'",
  // Next.js inline hydration + JSON-LD + 2GIS loader
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} maps.api.2gis.ru *.2gis.ru *.2gis.com`,
  // Tailwind/Framer Motion inline styles + Google Fonts CSS + 2GIS map styles
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com *.2gis.ru *.2gis.com",
  // Google Fonts files
  "font-src 'self' fonts.gstatic.com data:",
  // Next.js image optimization + 2GIS map tiles and icons
  "img-src 'self' data: blob: *.2gis.ru *.2gis.com",
  // 2GIS API requests and map data
  "connect-src 'self' *.2gis.ru *.2gis.com",
  // 2GIS SDK may spawn web workers
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
