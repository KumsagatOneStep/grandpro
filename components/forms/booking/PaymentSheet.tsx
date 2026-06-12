'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Banknote, CreditCard } from 'lucide-react'
import { PaymentMethod } from './types'

interface PaymentSheetProps {
  open: boolean
  value: PaymentMethod
  onChange: (v: PaymentMethod) => void
  onClose: () => void
}

const METHODS: { value: PaymentMethod; icon: typeof Banknote; labelKey: 'paymentCash' | 'paymentCard' }[] = [
  { value: 'cash', icon: Banknote,    labelKey: 'paymentCash' },
  { value: 'card', icon: CreditCard,  labelKey: 'paymentCard' },
]

export function PaymentSheet({ open, value, onChange, onClose }: PaymentSheetProps) {
  const t = useTranslations('booking')

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="payment-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            key="payment-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-2xl"
            style={{
              background: 'var(--bg-surface)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
              maxWidth: '480px',
              margin: '0 auto',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
            </div>

            <div className="px-5 pb-6">
              <p className="font-heading font-bold text-base mb-4" style={{ color: 'var(--color-text)' }}>
                {t('paymentTitle')}
              </p>
              {METHODS.map(m => {
                const active = value === m.value
                const Icon = m.icon
                return (
                  <label
                    key={m.value}
                    className="flex items-center justify-between p-4 rounded-xl mb-2 cursor-pointer transition-all"
                    style={{
                      background: active ? 'rgba(14,165,233,0.08)' : 'var(--bg-main)',
                      border: active ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                      <span className="font-semibold text-sm" style={{ color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>
                        {t(m.labelKey)}
                      </span>
                    </div>
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: active ? 'var(--color-primary)' : 'var(--color-border)' }}
                    >
                      {active && (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-primary)' }} />
                      )}
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      value={m.value}
                      checked={active}
                      onChange={() => { onChange(m.value); onClose() }}
                      className="sr-only"
                    />
                  </label>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
