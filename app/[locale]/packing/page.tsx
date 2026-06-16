import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScrollProgress } from '@/components/ui/ScrollProgress'
import { BackToTop } from '@/components/ui/BackToTop'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { PackingPageClient } from '@/components/sections/packing/PackingPageClient'

const META = {
  ru: {
    title: 'Упаковочные материалы — GrandPro Moving Алматы',
    description: 'Купить стрейч-плёнку, коробки, пупырчатую плёнку и инструменты для переезда в Алматы. Доставка или самовывоз.',
  },
  kz: {
    title: 'Орау материалдары — GrandPro Moving Алматы',
    description: 'Стрейч-пленка, қораптар, көпіршікті пленка және жылжу үшін құралдар. Жеткізу немесе өзіңіз аласыз.',
  },
  en: {
    title: 'Packing Supplies — GrandPro Moving Almaty',
    description: 'Buy stretch film, boxes, bubble wrap and moving tools in Almaty. Pickup or delivery available.',
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
      url: `https://grandpro.kz/${locale}/packing`,
      type: 'website',
    },
  }
}

export default function PackingPage() {
  return (
    <>
      <ScrollProgress />
      <Header />
      <main>
        <PackingPageClient />
      </main>
      <Footer />
      <BackToTop />
      <ChatWidget />
    </>
  )
}
