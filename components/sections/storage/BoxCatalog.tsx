'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { PackageOpen } from 'lucide-react'
import type { StorageBox, StorageFilters } from '@/lib/storage-data'
import { filterBoxes } from '@/lib/storage-data'
import { BoxCard } from './BoxCard'

interface BoxCatalogProps {
  boxes: StorageBox[]
  filters: StorageFilters
  onBook: (box: StorageBox) => void
}

export function BoxCatalog({ boxes, filters, onBook }: BoxCatalogProps) {
  const t = useTranslations('storagePage')
  const visible = filterBoxes(boxes, filters)

  return (
    <div>
      <AnimatePresence mode="wait">
        {visible.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          >
            <PackageOpen size={48} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
            <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t('empty')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {visible.map((box, i) => (
              <motion.div
                key={box.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
              >
                <BoxCard box={box} onBook={onBook} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
