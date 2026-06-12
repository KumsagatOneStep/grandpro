'use client'
import { useTranslations } from 'next-intl'
import { ArrowRight, ChevronDown, Shield, Truck, Users, Award, Star } from 'lucide-react'
import { BookingForm } from '@/components/forms/BookingForm'

export function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section
      className="min-h-screen flex items-center relative pt-20 sm:pt-24 lg:pt-32 pb-10 sm:pb-12 lg:pb-16 overflow-hidden"
      style={{ background: 'var(--gradient-hero)' }}
    >
      {/* Decorative blobs — isolated container forces iOS Safari to respect overflow clip on filter layers */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
        style={{ transform: 'translateZ(0)' }}
      >
        <div
          className="absolute top-0 right-0 w-[700px] h-[700px]"
          style={{
            background: 'radial-gradient(ellipse at 80% 20%, rgba(14,165,233,0.18) 0%, transparent 60%)',
            filter: 'blur(40px)',
            animation: 'float-blob 10s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px]"
          style={{
            background: 'radial-gradient(ellipse at 20% 80%, rgba(34,211,238,0.1) 0%, transparent 60%)',
            filter: 'blur(40px)',
            animation: 'float-blob 14s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Fine dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--color-text-muted) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          opacity: 0.03,
        }}
        aria-hidden="true"
      />

      <div className="max-w-[1280px] mx-auto px-6 w-full relative z-10">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-14 items-center">

          {/* Left: Content */}
          <div>
            {/* Trust badges */}
            <div className="flex flex-wrap gap-2 mb-7">
              {[
                { icon: Award, text: t('badge') },
                { icon: Shield, text: '100% ' + t('stats.guarantee') },
                { icon: Star, text: 'Рейтинг 5.0' },
              ].map((b, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: 'var(--active-badge)',
                    border: '1px solid var(--color-primary)',
                    color: 'var(--color-primary)',
                    animation: `pulse-badge 3s ease-in-out ${i * 0.5}s infinite`,
                  }}
                >
                  <b.icon size={12} />
                  {b.text}
                </div>
              ))}
            </div>

            <h1
              className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.75rem] font-extrabold leading-[1.1] tracking-tight mb-6"
              style={{ color: 'var(--color-text)' }}
            >
              {t('title')}{' '}
              <span
                style={{
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {t('titleAccent')}
              </span>
            </h1>

            <p
              className="text-sm sm:text-base lg:text-lg leading-relaxed mb-9 sm:max-w-xl"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {t('subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#calculator"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white
                  w-full sm:w-auto transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                style={{
                  background: 'var(--gradient-primary)',
                  boxShadow: '0 4px 24px rgba(14,165,233,0.35)',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(14,165,233,0.55)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(14,165,233,0.35)')}
              >
                {t('ctaPrimary')}
                <ArrowRight size={16} />
              </a>
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold
                  w-full sm:w-auto transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  boxShadow: '0 2px 12px var(--shadow-main)',
                }}
              >
                {t('ctaSecondary')}
              </a>
            </div>

            {/* Stats */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 pt-8"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              {[
                { icon: Users, value: '12 000+', label: t('stats.clients') },
                { icon: Truck, value: '10', label: t('stats.years') },
                { icon: Truck, value: '47', label: t('stats.trucks') },
                { icon: Shield, value: '100%', label: t('stats.guarantee') },
              ].map((stat, i) => (
                <div key={i} className="group">
                  <p
                    className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight"
                    style={{
                      background: 'var(--gradient-primary)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Booking form */}
          <div className="w-full min-w-0 max-w-md mx-auto lg:mx-0">
            <BookingForm />
          </div>
        </div>
      </div>

      <a
        href="#services"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
        aria-label="Scroll down"
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
      >
        <ChevronDown size={28} />
      </a>
    </section>
  )
}
