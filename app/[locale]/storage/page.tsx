import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScrollProgress } from '@/components/ui/ScrollProgress'
import { BackToTop } from '@/components/ui/BackToTop'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { StoragePageClient } from '@/components/sections/storage/StoragePageClient'

const META = {
  ru: {
    title: 'Хранение вещей — GrandPro Moving Алматы',
    description: 'Аренда боксов для хранения вещей в Алматы. Безопасно, доступно, 24/7. Боксы от 2 м² в 4 локациях.',
  },
  kz: {
    title: 'Заттарды сақтау — GrandPro Moving Алматы',
    description: 'Алматыда жеке бокс жалға алу. Қауіпсіз, 2 м²-ден бастап, 4 локация, тәулік бойы қол жетімді.',
  },
  en: {
    title: 'Self Storage Units — GrandPro Moving Almaty',
    description: 'Secure storage units for rent in Almaty. From 2 m², 4 locations, 24/7 access.',
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
      url: `https://grandpro.kz/${locale}/storage`,
      type: 'website',
    },
  }
}

export default function StoragePage() {
  return (
    <>
      <ScrollProgress />
      <Header />
      <main>
        <StoragePageClient />
      </main>
      <Footer />
      <BackToTop />
      <ChatWidget />
    </>
  )
}
