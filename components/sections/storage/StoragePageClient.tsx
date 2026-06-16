'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ArrowRight, Phone, Clock, MapPin } from 'lucide-react'
import {
  STORAGE_LOCATIONS, STORAGE_BOXES,
  DEFAULT_FILTERS, getLocationById,
  type StorageBox, type StorageFilters,
} from '@/lib/storage-data'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { LocationTabs } from './LocationTabs'
import { StorageMap } from './StorageMap'
import { StorageFilters as FiltersBar } from './StorageFilters'
import { BoxCatalog } from './BoxCatalog'
import { BookingModal } from './BookingModal'

const HOW_STEPS = ['1', '2', '3', '4'] as const
const FAQ_ITEMS = ['1', '2', '3', '4', '5'] as const

export function StoragePageClient() {
  const t = useTranslations('storagePage')
  const [activeLocationId, setActiveLocationId] = useState(STORAGE_LOCATIONS[0].id)
  const [filters, setFilters] = useState<StorageFilters>(DEFAULT_FILTERS)
  const [selectedBox, setSelectedBox] = useState<StorageBox | null>(null)

  const activeLocation = getLocationById(activeLocationId)!
  const locationBoxes = STORAGE_BOXES.filter(b => b.locationId === activeLocationId)

  function handleLocationChange(id: string) {
    setActiveLocationId(id)
    setFilters(DEFAULT_FILTERS)
  }

  return (
    <>
      {/* ── Hero ── */}
      <section
        className="pt-28 pb-12 px-4 sm:pt-36 sm:pb-16 sm:px-6 text-center"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 tracking-tight"
            style={{ color: 'var(--color-text)' }}
          >
            {t('hero.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-base sm:text-lg mb-8 max-w-xl mx-auto"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.a
            href="#catalog"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl font-bold text-white"
            style={{ background: 'var(--gradient-primary)' }}
          >
            {t('hero.cta')} <ArrowRight size={18} />
          </motion.a>
        </div>
      </section>

      {/* ── Location Tabs + Map + Info ── */}
      <section className="py-10 px-4 sm:px-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-[1280px] mx-auto flex flex-col gap-5">
          <LocationTabs
            locations={STORAGE_LOCATIONS}
            activeId={activeLocationId}
            onChange={handleLocationChange}
          />

          <div className="grid sm:grid-cols-[1fr_300px] gap-5 items-start">
            <StorageMap
              lat={activeLocation.lat}
              lon={activeLocation.lon}
              locationName={activeLocation.name}
              address={activeLocation.address}
              height="260px"
            />
            <div
              className="flex flex-col gap-3 p-5 rounded-2xl"
              style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--color-border)' }}
            >
              <p className="font-heading font-bold text-base" style={{ color: 'var(--color-text)' }}>
                {t('mapTitle')}
              </p>
              <div className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <MapPin size={15} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                {activeLocation.address}
              </div>
              <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <Clock size={15} className="flex-shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                {activeLocation.hours}
              </div>
              <a
                href={`tel:${activeLocation.phone}`}
                className="flex items-center gap-2.5 text-sm font-semibold"
                style={{ color: 'var(--color-primary)' }}
              >
                <Phone size={15} aria-hidden="true" />
                {activeLocation.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Catalog ── */}
      <section id="catalog" className="py-12 px-4 sm:py-16 sm:px-6" style={{ background: 'var(--bg-main)' }}>
        <div className="max-w-[1280px] mx-auto flex flex-col gap-6">
          <FiltersBar filters={filters} onChange={setFilters} />
          <BoxCatalog boxes={locationBoxes} filters={filters} onBook={setSelectedBox} />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-14 px-4 sm:py-20 sm:px-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-[1280px] mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-center mb-10" style={{ color: 'var(--color-text)' }}>
            {t('howItWorks.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((n, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }} transition={{ delay: i * 0.1 }}
                className="flex flex-col gap-3 p-6 rounded-2xl"
                style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--color-border)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-extrabold text-lg text-white flex-shrink-0"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {n}
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                  {t(`howItWorks.step${n}title` as Parameters<typeof t>[0])}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {t(`howItWorks.step${n}desc` as Parameters<typeof t>[0])}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 px-4 sm:py-20 sm:px-6" style={{ background: 'var(--bg-main)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-center mb-10" style={{ color: 'var(--color-text)' }}>
            {t('faq.title')}
          </h2>
          <Accordion>
            {FAQ_ITEMS.map(n => (
              <AccordionItem key={n} value={n}>
                <AccordionTrigger>
                  {t(`faq.q${n}` as Parameters<typeof t>[0])}
                </AccordionTrigger>
                <AccordionContent>
                  {t(`faq.a${n}` as Parameters<typeof t>[0])}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Booking Modal ── */}
      <AnimatePresence>
        {selectedBox && (
          <BookingModal
            box={selectedBox}
            location={getLocationById(selectedBox.locationId)!}
            onClose={() => setSelectedBox(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
