'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'

interface CartFabProps {
  count: number
  onClick: () => void
}

export function CartFab({ count, onClick }: CartFabProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          key="cart-fab"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={onClick}
          aria-label={`Открыть корзину — ${count} товар(а)`}
          className="fixed bottom-6 right-6 z-[900] w-14 h-14 rounded-full flex items-center justify-center shadow-lg relative"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <ShoppingCart size={24} color="#fff" />
          <span
            className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
          >
            {count > 99 ? '99+' : count}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
