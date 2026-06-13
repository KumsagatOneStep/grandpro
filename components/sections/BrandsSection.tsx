'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Marquee } from '@/components/ui/Marquee'

interface Brand {
  name: string
  localLogo?: string   // /brands/xxx.png in public/
  domain?: string      // fallback: Google favicon
  color: string
  weight?: string
  fontStyle?: string
  letterSpacing?: string
  fontSize?: string
  invertOnDark?: boolean
}

const BRANDS: Brand[] = [
  { name: 'Blum',            domain: 'blum.com',            color: '#1B3F6E', weight: '700', letterSpacing: '0.06em' },
  { name: 'Technodom',       domain: 'technodom.kz',        color: '#E40000', weight: '800' },
  { name: 'Hettich',         domain: 'hettich.com',         color: '#003087', weight: '700', letterSpacing: '0.06em' },
  { name: 'Jetour',          localLogo: '/brands/jetour.png',           color: '#111111', weight: '800', letterSpacing: '0.08em' },
  { name: 'Eurasian Bank',   domain: 'eubank.kz',           color: '#0066CC', weight: '600' },
  { name: 'Halyk Lising',    localLogo: '/brands/halyk-lising.png',     color: '#2E7D32', weight: '700' },
  { name: 'AlmatyHub',       localLogo: '/brands/almatyhub.webp', color: '#111111', weight: '700', letterSpacing: '0.02em', invertOnDark: true },
  { name: 'ЯндексПро',       domain: 'yandex.ru',           color: '#FC3F1D', weight: '800' },
  { name: 'Рахат Fest',      domain: 'rakhat.kz',           color: '#D4770A', weight: '700' },
  { name: 'Almaty Marathon', localLogo: '/brands/almaty-marathon.png',  color: '#E53935', weight: '800', letterSpacing: '0.04em' },
  { name: 'Dyson',           domain: 'dyson.com',           color: '#C8102E', weight: '300', letterSpacing: '0.16em' },
  { name: 'Hyundai',         domain: 'hyundai.com',         color: '#002C5F', weight: '800', letterSpacing: '0.05em' },
  { name: 'Ai-Cha food',     localLogo: '/brands/aicha.png',            color: '#E40000', weight: '600', fontStyle: 'italic' },
]

function BrandLogo({ brand }: { brand: Brand }) {
  const [ok, setOk] = useState(true)

  if (brand.localLogo) {
    return (
      <div className="w-14 h-14 flex items-center justify-center rounded-2xl overflow-hidden"
        style={{ background: `${brand.color}12` }}>
        <Image
          src={brand.localLogo}
          alt={brand.name}
          width={48}
          height={48}
          className={`w-11 h-11 object-contain${brand.invertOnDark ? ' dark:invert' : ''}`}
        />
      </div>
    )
  }

  const src = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${brand.domain}&size=128`

  return (
    <div className="w-14 h-14 flex items-center justify-center rounded-2xl overflow-hidden"
      style={{ background: `${brand.color}12` }}>
      {ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={brand.name}
          width={40}
          height={40}
          onError={() => setOk(false)}
          className="w-10 h-10 object-contain"
        />
      ) : (
        <span className="font-heading font-black text-xl" style={{ color: brand.color }}>
          {brand.name[0]}
        </span>
      )}
    </div>
  )
}

function BrandItem({ brand }: { brand: Brand }) {
  return (
    <div className="mx-10 flex flex-col items-center gap-2.5 cursor-default select-none" style={{ minWidth: 90 }}>
      <BrandLogo brand={brand} />
      <span
        className="whitespace-nowrap text-center leading-tight"
        style={{
          fontSize: brand.fontSize ?? '11px',
          fontWeight: brand.weight ?? '600',
          fontStyle: brand.fontStyle ?? 'normal',
          letterSpacing: brand.letterSpacing ?? '0.04em',
          color: brand.color,
          opacity: 0.8,
          maxWidth: 90,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {brand.name}
      </span>
    </div>
  )
}

export function BrandsSection() {
  return (
    <div
      className="py-12"
      style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <Marquee duration={45} pauseOnHover fade fadeAmount={10}>
        {BRANDS.map(brand => (
          <BrandItem key={brand.name} brand={brand} />
        ))}
      </Marquee>
    </div>
  )
}
