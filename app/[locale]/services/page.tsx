import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BackToTop } from '@/components/ui/BackToTop'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { ScrollProgress } from '@/components/ui/ScrollProgress'
import { ServicesPageClient } from '@/components/sections/services/ServicesPageClient'

export const metadata = {
  title: 'Услуги — GrandPro Moving Almaty',
  description: 'Квартирный и офисный переезд, грузоперевозки, такелаж, упаковка. Оформите заявку онлайн — перезвоним за 15 минут.',
}

export default function ServicesPage() {
  return (
    <>
      <ScrollProgress />
      <Header />
      <main>
        <ServicesPageClient />
      </main>
      <Footer />
      <BackToTop />
      <ChatWidget />
    </>
  )
}
