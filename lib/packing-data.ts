// lib/packing-data.ts

export type PackingCategory = 'film' | 'boxes' | 'protection' | 'tools'

export interface PackingProduct {
  id: string
  category: PackingCategory
  name: string
  description: string
  price: number       // KZT per unit
  unit: string        // "рул." | "шт." | "уп." | "пара"
  images: string[]    // paths under /images/packing/; first = main
  inStock: boolean
  popular?: boolean
}

export type CartItem = {
  product: PackingProduct
  qty: number
}

export const PACKING_CATEGORIES: { id: PackingCategory; labelKey: string }[] = [
  { id: 'film',       labelKey: 'tabs.film' },
  { id: 'boxes',      labelKey: 'tabs.boxes' },
  { id: 'protection', labelKey: 'tabs.protection' },
  { id: 'tools',      labelKey: 'tabs.tools' },
]

export const PACKING_PRODUCTS: PackingProduct[] = [
  // ── film ──
  {
    id: 'film-stretch-500',
    category: 'film',
    name: 'Стрейч-плёнка 500мм × 300м',
    description: 'Профессиональная растягивающаяся плёнка для обмотки мебели и коробок.',
    price: 1200,
    unit: 'рул.',
    images: ['/images/packing/stretch-500-1.jpg', '/images/packing/stretch-500-2.jpg'],
    inStock: true,
    popular: true,
  },
  {
    id: 'film-stretch-200',
    category: 'film',
    name: 'Стрейч-плёнка 200мм × 150м',
    description: 'Компактный рулон для упаковки небольших предметов и связки вещей.',
    price: 650,
    unit: 'рул.',
    images: ['/images/packing/stretch-200-1.jpg'],
    inStock: true,
  },
  {
    id: 'tape-packing-50',
    category: 'film',
    name: 'Скотч упаковочный 50мм × 66м',
    description: 'Прозрачный упаковочный скотч с надёжной клеящей основой для коробок.',
    price: 320,
    unit: 'шт.',
    images: ['/images/packing/tape-packing-1.jpg', '/images/packing/tape-packing-2.jpg'],
    inStock: true,
    popular: true,
  },
  {
    id: 'tape-painter-25',
    category: 'film',
    name: 'Малярный скотч 25мм × 50м',
    description: 'Для маркировки, защиты поверхностей и временной фиксации.',
    price: 280,
    unit: 'шт.',
    images: ['/images/packing/tape-painter-1.jpg'],
    inStock: true,
  },
  {
    id: 'tape-double-side',
    category: 'film',
    name: 'Двусторонний скотч 50мм × 25м',
    description: 'Для фиксации защитных материалов и ковров при транспортировке.',
    price: 450,
    unit: 'шт.',
    images: ['/images/packing/tape-double-1.jpg'],
    inStock: true,
  },
  // ── boxes ──
  {
    id: 'box-s',
    category: 'boxes',
    name: 'Коробка S (30×20×20 см)',
    description: 'Для книг, посуды, мелкой электроники и плотных тяжёлых вещей.',
    price: 350,
    unit: 'шт.',
    images: ['/images/packing/box-s-1.jpg', '/images/packing/box-s-2.jpg'],
    inStock: true,
  },
  {
    id: 'box-m',
    category: 'boxes',
    name: 'Коробка M (40×30×30 см)',
    description: 'Универсальный размер для большинства бытовых вещей.',
    price: 520,
    unit: 'шт.',
    images: ['/images/packing/box-m-1.jpg', '/images/packing/box-m-2.jpg'],
    inStock: true,
    popular: true,
  },
  {
    id: 'box-l',
    category: 'boxes',
    name: 'Коробка L (60×40×40 см)',
    description: 'Для постельного белья, подушек, лёгкой одежды и объёмных вещей.',
    price: 750,
    unit: 'шт.',
    images: ['/images/packing/box-l-1.jpg'],
    inStock: true,
  },
  {
    id: 'box-xl',
    category: 'boxes',
    name: 'Коробка XL (80×50×50 см)',
    description: 'Крупногабаритная коробка для мягкой мебели, штор и крупных вещей.',
    price: 950,
    unit: 'шт.',
    images: ['/images/packing/box-xl-1.jpg'],
    inStock: true,
  },
  {
    id: 'box-wardrobe',
    category: 'boxes',
    name: 'Телескопическая коробка для одежды',
    description: 'Регулируемая высота, перекладина для вешалок — одежда едет без складок.',
    price: 1400,
    unit: 'шт.',
    images: ['/images/packing/box-wardrobe-1.jpg', '/images/packing/box-wardrobe-2.jpg'],
    inStock: true,
  },
  // ── protection ──
  {
    id: 'bubble-wrap-100',
    category: 'protection',
    name: 'Пупырчатая плёнка 100м × 50см',
    description: 'Надёжная защита хрупких предметов, зеркал, стёкол и техники.',
    price: 2800,
    unit: 'рул.',
    images: ['/images/packing/bubble-100-1.jpg', '/images/packing/bubble-100-2.jpg'],
    inStock: true,
    popular: true,
  },
  {
    id: 'bubble-wrap-50',
    category: 'protection',
    name: 'Пупырчатая плёнка 50м × 50см',
    description: 'Экономичный рулон для частичной упаковки и защиты отдельных предметов.',
    price: 1500,
    unit: 'рул.',
    images: ['/images/packing/bubble-50-1.jpg'],
    inStock: true,
  },
  {
    id: 'foam-roll',
    category: 'protection',
    name: 'Вспененный полиэтилен 50м × 1м',
    description: 'Мягкая подложка для защиты поверхностей мебели от царапин.',
    price: 1900,
    unit: 'рул.',
    images: ['/images/packing/foam-1.jpg'],
    inStock: true,
  },
  {
    id: 'corner-plastic',
    category: 'protection',
    name: 'Пластиковые уголки для мебели',
    description: 'Защита углов шкафов, столов и рам при перевозке. Упаковка 50 штук.',
    price: 800,
    unit: 'уп.',
    images: ['/images/packing/corner-1.jpg', '/images/packing/corner-2.jpg'],
    inStock: true,
  },
  {
    id: 'furniture-cover',
    category: 'protection',
    name: 'Чехол для мебели (диван/кресло)',
    description: 'Плотный полиэтиленовый чехол защищает от пыли и влаги при переезде.',
    price: 1100,
    unit: 'шт.',
    images: ['/images/packing/cover-1.jpg'],
    inStock: true,
  },
  // ── tools ──
  {
    id: 'straps-pair',
    category: 'tools',
    name: 'Стяжные ремни 5м (2 шт.)',
    description: 'Для фиксации грузов в кузове. Нагрузка до 500 кг.',
    price: 1600,
    unit: 'пара',
    images: ['/images/packing/straps-1.jpg', '/images/packing/straps-2.jpg'],
    inStock: true,
    popular: true,
  },
  {
    id: 'gloves-xl',
    category: 'tools',
    name: 'Рабочие перчатки XL',
    description: 'Прорезиненные перчатки для безопасной переноски мебели и коробок.',
    price: 900,
    unit: 'уп.',
    images: ['/images/packing/gloves-1.jpg'],
    inStock: true,
  },
  {
    id: 'gloves-l',
    category: 'tools',
    name: 'Рабочие перчатки L',
    description: 'Прорезиненные перчатки для безопасной переноски мебели и коробок.',
    price: 900,
    unit: 'уп.',
    images: ['/images/packing/gloves-1.jpg'],
    inStock: true,
  },
  {
    id: 'marker-black',
    category: 'tools',
    name: 'Маркер для коробок (чёрный)',
    description: 'Перманентный маркер для подписи содержимого и маркировки коробок.',
    price: 180,
    unit: 'шт.',
    images: ['/images/packing/marker-1.jpg'],
    inStock: true,
  },
  {
    id: 'cutter-retract',
    category: 'tools',
    name: 'Нож-резак выдвижной',
    description: 'Для вскрытия коробок и нарезки упаковочных материалов.',
    price: 350,
    unit: 'шт.',
    images: ['/images/packing/cutter-1.jpg'],
    inStock: true,
  },
]

export function getProductById(id: string): PackingProduct | undefined {
  return PACKING_PRODUCTS.find(p => p.id === id)
}

export const VALID_PRODUCT_IDS = new Set<string>(PACKING_PRODUCTS.map(p => p.id))
