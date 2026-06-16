'use client'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { PACKING_PRODUCTS, type PackingCategory, type PackingProduct } from '@/lib/packing-data'
import { useCart } from '@/hooks/useCart'
import { CategoryTabs } from './CategoryTabs'
import { ProductGrid } from './ProductGrid'
import { CartFab } from './CartFab'
import { CartDrawer } from './CartDrawer'

export function PackingPageClient() {
  const t = useTranslations('packingPage')
  const [activeCategory, setActiveCategory] = useState<PackingCategory | 'all'>('all')
  const [cartOpen, setCartOpen] = useState(false)
  const cart = useCart()

  const filteredProducts =
    activeCategory === 'all'
      ? PACKING_PRODUCTS
      : PACKING_PRODUCTS.filter(p => p.category === activeCategory)

  function handleAddItem(product: PackingProduct, qty: number) {
    cart.addItem(product, qty)
  }

  return (
    <>
      {/* Hero */}
      <section
        className="pt-28 pb-10 px-4 sm:pt-36 sm:pb-14 sm:px-6 text-center"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <h1
          className="font-heading font-extrabold text-3xl sm:text-5xl leading-tight mb-4"
          style={{ color: 'var(--color-text)' }}
        >
          {t('hero.title')}
        </h1>
        <p
          className="text-base sm:text-lg max-w-xl mx-auto"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('hero.subtitle')}
        </p>
      </section>

      {/* Category tabs */}
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

      {/* Product grid */}
      <section className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
        <ProductGrid
          products={filteredProducts}
          onAddItem={handleAddItem}
        />
      </section>

      {/* Cart FAB */}
      <CartFab count={cart.count} onClick={() => setCartOpen(true)} />

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <CartDrawer
            key="cart-drawer"
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            cart={cart}
          />
        )}
      </AnimatePresence>
    </>
  )
}
