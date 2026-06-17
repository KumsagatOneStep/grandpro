'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ShoppingBag } from 'lucide-react'
import { type PackingProduct } from '@/lib/packing-data'
import { ProductCard } from './ProductCard'

interface ProductGridProps {
  products: PackingProduct[]
  onAddItem: (p: PackingProduct, qty: number) => void
  cartItemIds: Set<string>
}

export function ProductGrid({ products, onAddItem, cartItemIds }: ProductGridProps) {
  const t = useTranslations('packingPage')

  return (
    <AnimatePresence mode="wait">
      {products.length === 0 ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ShoppingBag size={48} strokeWidth={1.2} />
          <p className="text-sm">{t('product.empty')}</p>
        </motion.div>
      ) : (
        <motion.div
          key="grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="h-full"
            >
              <ProductCard product={product} onAdd={onAddItem} isInCart={cartItemIds.has(product.id)} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
