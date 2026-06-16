'use client'
import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { type PackingProduct } from '@/lib/packing-data'

interface ProductCardProps {
  product: PackingProduct
  onAdd: (p: PackingProduct, qty: number) => void
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const t = useTranslations('packingPage')
  const [photoIndex, setPhotoIndex] = useState(0)
  const [qty, setQty] = useState(1)
  const touchStartX = useRef(0)
  const { images } = product
  const hasMultiple = images.length > 1

  function prev() { setPhotoIndex(i => (i - 1 + images.length) % images.length) }
  function next() { setPhotoIndex(i => (i + 1) % images.length) }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const deltaX = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(deltaX) > 50) deltaX > 0 ? next() : prev()
  }

  function handleAdd() {
    if (!product.inStock) return
    onAdd(product, qty)
    setQty(1)
  }

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* Image slider */}
      <div
        className="relative group aspect-[4/3] overflow-hidden bg-gray-100"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[photoIndex]}
          alt={product.name}
          className="w-full h-full object-cover transition-opacity duration-200"
        />

        {/* Popular / out-of-stock badge */}
        {!product.inStock ? (
          <span
            className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--bg-surface-elevated)', color: 'var(--color-text-muted)' }}
          >
            {t('product.outOfStock')}
          </span>
        ) : product.popular ? (
          <span
            className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--active-badge)', color: 'var(--color-primary)' }}
          >
            {t('product.hit')}
          </span>
        ) : null}

        {/* Arrows */}
        {hasMultiple && (
          <>
            <button
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Next photo"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
              ›
            </button>
          </>
        )}

        {/* Dots */}
        {hasMultiple && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setPhotoIndex(i)}
                aria-label={`Photo ${i + 1}`}
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{
                  background: i === photoIndex ? 'var(--color-primary)' : 'rgba(255,255,255,0.6)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3
          className="text-sm font-semibold leading-snug"
          style={{ color: 'var(--color-text)' }}
        >
          {product.name}
        </h3>
        <p
          className="text-xs line-clamp-2 flex-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {product.description}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>
            {product.price.toLocaleString('ru-RU')} ₸
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('product.perUnit', { unit: product.unit } as Record<string, string>)}
          </span>
        </div>

        {/* Qty + add */}
        <div className="flex items-center gap-2 mt-1">
          <div
            className="flex items-center rounded-lg overflow-hidden border"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-8 h-8 flex items-center justify-center text-lg"
              style={{ color: 'var(--color-text)' }}
            >
              −
            </button>
            <span
              className="w-8 text-center text-sm font-medium"
              style={{ color: 'var(--color-text)' }}
            >
              {qty}
            </span>
            <button
              onClick={() => setQty(q => q + 1)}
              className="w-8 h-8 flex items-center justify-center text-lg"
              style={{ color: 'var(--color-text)' }}
            >
              +
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className="flex-1 h-8 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
            style={{
              background: 'var(--gradient-primary)',
              color: '#fff',
            }}
          >
            {t('product.addToCart')}
          </button>
        </div>
      </div>
    </div>
  )
}
