import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScrollProgress } from '@/components/ui/ScrollProgress'
import { BackToTop } from '@/components/ui/BackToTop'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { CooperationPageClient } from '@/components/sections/cooperation/CooperationPageClient'

const META = {
  ru: {
    title: 'Сотрудничество — GrandPro Moving Алматы',
    description: 'Корпоративные договоры и партнёрство с GrandPro Moving. Свяжитесь с нами.',
  },
  kz: {
    title: 'Серіктестік — GrandPro Moving Алматы',
    description: 'Корпоративтік шарттар мен серіктестік. Бізбен хабарласыңыз.',
  },
  en: {
    title: 'Partnership — GrandPro Moving Almaty',
    description: 'Corporate contracts and partnership with GrandPro Moving. Get in touch.',
  },
} as const

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const m = META[locale as keyof typeof META] ?? META.ru
  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.title,
      description: m.description,
      url: `https://grandpro.kz/${locale}/partners`,
      type: 'website',
    },
  }
}

export default function PartnersPage() {
  return (
    <>
      <ScrollProgress />
      <Header />
      <main>
        <CooperationPageClient />
      </main>
      <Footer />
      <BackToTop />
      <ChatWidget />
    </>
  )
}
