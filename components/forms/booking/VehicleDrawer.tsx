'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ChevronLeft, Truck } from 'lucide-react'
import { VEHICLES } from './types'
import { formatPrice } from '@/lib/utils'

interface VehicleDrawerProps {
  open: boolean
  selectedId: string
  onConfirm: (vehicleId: string) => void
  onClose: () => void
}

export function VehicleDrawer({ open, selectedId, onConfirm, onClose }: VehicleDrawerProps) {
  const t = useTranslations('booking')

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="vehicle-drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="absolute inset-0 z-10 flex flex-col rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-surface)' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
              style={{ background: 'var(--bg-main)', color: 'var(--color-text-muted)' }}
              aria-label={t('back')}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-heading font-bold text-base" style={{ color: 'var(--color-text)' }}>
              {t('vehicleTitle')}
            </span>
          </div>

          {/* Vehicle list */}
          <div className="flex-1 overflow-y-auto py-3 px-4 space-y-2">
            {VEHICLES.map(v => {
              const active = v.id === selectedId
              return (
                <button
                  key={v.id}
                  onClick={() => onConfirm(v.id)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-150 text-left"
                  style={{
                    background: active ? 'rgba(14,165,233,0.1)' : 'var(--bg-main)',
                    border: active ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  }}
                >
                  <div
                    className="w-12 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? 'rgba(14,165,233,0.15)' : 'var(--bg-surface-elevated)' }}
                  >
                    <Truck size={22} style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>
                      {v.label}
                    </p>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {v.capacity}{t('tonnes')}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {v.length}{t('metres')}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {v.volume}{t('volume')}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>
                    {formatPrice(v.basePrice)}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Confirm */}
          <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={() => onConfirm(selectedId)}
              className="w-full py-3.5 rounded-xl font-bold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 16px rgba(14,165,233,0.3)' }}
            >
              {t('confirm')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
