import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScrollProgress } from '@/components/ui/ScrollProgress'
import { BackToTop } from '@/components/ui/BackToTop'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { StoragePageClient } from '@/components/sections/storage/StoragePageClient'

export const metadata: Metadata = {
  title: 'Хранение вещей — GrandPro Moving Алматы',
  description: 'Аренда боксов для хранения вещей в Алматы. Безопасно, доступно, 24/7. Боксы от 2 м² в 4 локациях.',
  openGraph: {
    title: 'Склад и хранение — GrandPro Moving',
    description: 'Аренда боксов в Алматы. От 2 м², 4 локации, доступ 24/7.',
    url: 'https://grandpro.kz/storage',
    type: 'website',
  },
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
