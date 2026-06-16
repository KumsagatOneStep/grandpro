// lib/storage-data.ts

export type BoxSize = 'S' | 'M' | 'L' | 'XL'
export type RentalDuration = 1 | 3 | 6 | 12

export interface StorageLocation {
  id: string
  name: string
  address: string
  lat: number
  lon: number
  hours: string
  phone: string
}

export interface StorageBox {
  id: string
  locationId: string
  number: string
  floor: number
  area: number
  size: BoxSize
  available: boolean
  photo: string
  pricing: {
    m1: number
    m3: number
    m6: number
    m12: number
  }
}

export interface StorageFilters {
  sizes: BoxSize[]
  priceMin: number
  priceMax: number
  floor: number | null
  availableOnly: boolean
}

export const DEFAULT_FILTERS: StorageFilters = {
  sizes: [],
  priceMin: 0,
  priceMax: 0,
  floor: null,
  availableOnly: false,
}

export const STORAGE_LOCATIONS: StorageLocation[] = [
  {
    id: 'bostandyk',
    name: 'Бостандык',
    address: 'пр. Достык 5, Алматы',
    lat: 43.234,
    lon: 76.969,
    hours: 'Пн–Вс 00:00–24:00',
    phone: '+7 707 709 74 22',
  },
  {
    id: 'alatau',
    name: 'Алатауский',
    address: 'ул. Момышулы 12, Алматы',
    lat: 43.315,
    lon: 76.899,
    hours: 'Пн–Вс 00:00–24:00',
    phone: '+7 707 709 74 22',
  },
  {
    id: 'medeu',
    name: 'Медеуский',
    address: 'ул. Горная 3, Алматы',
    lat: 43.194,
    lon: 76.959,
    hours: 'Пн–Вс 00:00–24:00',
    phone: '+7 707 709 74 22',
  },
  {
    id: 'zhetysu',
    name: 'Жетысуский',
    address: 'ул. Саина 42, Алматы',
    lat: 43.293,
    lon: 77.027,
    hours: 'Пн–Вс 00:00–24:00',
    phone: '+7 707 709 74 22',
  },
]

export const STORAGE_BOXES: StorageBox[] = [
  // Бостандык
  { id: 'b-01', locationId: 'bostandyk', number: 'Бокс №01', floor: 1, area: 3, size: 'S', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 8000,  m3: 7200,  m6: 6400,  m12: 5600 } },
  { id: 'b-02', locationId: 'bostandyk', number: 'Бокс №02', floor: 1, area: 7, size: 'M', available: false, photo: '/images/storage-placeholder.jpg', pricing: { m1: 15000, m3: 13500, m6: 12000, m12: 10500 } },
  { id: 'b-03', locationId: 'bostandyk', number: 'Бокс №03', floor: 2, area: 12, size: 'L', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 28000, m3: 25200, m6: 22400, m12: 19600 } },
  { id: 'b-04', locationId: 'bostandyk', number: 'Бокс №04', floor: 2, area: 4,  size: 'S', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 8000,  m3: 7200,  m6: 6400,  m12: 5600 } },
  { id: 'b-05', locationId: 'bostandyk', number: 'Бокс №05', floor: 3, area: 25, size: 'XL', available: true, photo: '/images/storage-placeholder.jpg', pricing: { m1: 50000, m3: 45000, m6: 40000, m12: 35000 } },
  // Алатауский
  { id: 'a-01', locationId: 'alatau', number: 'Бокс №01', floor: 1, area: 4, size: 'S', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 8000,  m3: 7200,  m6: 6400,  m12: 5600 } },
  { id: 'a-02', locationId: 'alatau', number: 'Бокс №02', floor: 1, area: 9, size: 'M', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 15000, m3: 13500, m6: 12000, m12: 10500 } },
  { id: 'a-03', locationId: 'alatau', number: 'Бокс №03', floor: 2, area: 15, size: 'L', available: false, photo: '/images/storage-placeholder.jpg', pricing: { m1: 28000, m3: 25200, m6: 22400, m12: 19600 } },
  { id: 'a-04', locationId: 'alatau', number: 'Бокс №04', floor: 2, area: 6,  size: 'M', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 15000, m3: 13500, m6: 12000, m12: 10500 } },
  { id: 'a-05', locationId: 'alatau', number: 'Бокс №05', floor: 3, area: 30, size: 'XL', available: true, photo: '/images/storage-placeholder.jpg', pricing: { m1: 50000, m3: 45000, m6: 40000, m12: 35000 } },
  // Медеуский
  { id: 'm-01', locationId: 'medeu', number: 'Бокс №01', floor: 1, area: 2, size: 'S', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 8000,  m3: 7200,  m6: 6400,  m12: 5600 } },
  { id: 'm-02', locationId: 'medeu', number: 'Бокс №02', floor: 1, area: 8, size: 'M', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 15000, m3: 13500, m6: 12000, m12: 10500 } },
  { id: 'm-03', locationId: 'medeu', number: 'Бокс №03', floor: 2, area: 18, size: 'L', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 28000, m3: 25200, m6: 22400, m12: 19600 } },
  { id: 'm-04', locationId: 'medeu', number: 'Бокс №04', floor: 1, area: 3,  size: 'S', available: false, photo: '/images/storage-placeholder.jpg', pricing: { m1: 8000,  m3: 7200,  m6: 6400,  m12: 5600 } },
  { id: 'm-05', locationId: 'medeu', number: 'Бокс №05', floor: 3, area: 22, size: 'XL', available: true, photo: '/images/storage-placeholder.jpg', pricing: { m1: 50000, m3: 45000, m6: 40000, m12: 35000 } },
  // Жетысуский
  { id: 'z-01', locationId: 'zhetysu', number: 'Бокс №01', floor: 1, area: 5, size: 'M', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 15000, m3: 13500, m6: 12000, m12: 10500 } },
  { id: 'z-02', locationId: 'zhetysu', number: 'Бокс №02', floor: 1, area: 3, size: 'S', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 8000,  m3: 7200,  m6: 6400,  m12: 5600 } },
  { id: 'z-03', locationId: 'zhetysu', number: 'Бокс №03', floor: 2, area: 14, size: 'L', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 28000, m3: 25200, m6: 22400, m12: 19600 } },
  { id: 'z-04', locationId: 'zhetysu', number: 'Бокс №04', floor: 2, area: 8,  size: 'M', available: false, photo: '/images/storage-placeholder.jpg', pricing: { m1: 15000, m3: 13500, m6: 12000, m12: 10500 } },
  { id: 'z-05', locationId: 'zhetysu', number: 'Бокс №05', floor: 3, area: 35, size: 'XL', available: true, photo: '/images/storage-placeholder.jpg', pricing: { m1: 50000, m3: 45000, m6: 40000, m12: 35000 } },
]

export function filterBoxes(boxes: StorageBox[], f: StorageFilters): StorageBox[] {
  return boxes.filter(box => {
    if (f.sizes.length > 0 && !f.sizes.includes(box.size)) return false
    if (f.availableOnly && !box.available) return false
    if (f.floor !== null && box.floor !== f.floor) return false
    if (box.pricing.m1 < f.priceMin) return false
    if (f.priceMax > 0 && box.pricing.m1 > f.priceMax) return false
    return true
  })
}

export function getBoxById(id: string): StorageBox | undefined {
  return STORAGE_BOXES.find(b => b.id === id)
}

export function getLocationById(id: string): StorageLocation | undefined {
  return STORAGE_LOCATIONS.find(l => l.id === id)
}

export const VALID_BOX_IDS = new Set(STORAGE_BOXES.map(b => b.id))
export const VALID_LOCATION_IDS = new Set(STORAGE_LOCATIONS.map(l => l.id))
export const VALID_DURATIONS = new Set([1, 3, 6, 12])
