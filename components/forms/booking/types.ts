export interface Vehicle {
  id: string
  label: string
  capacity: number
  length: number
  volume: number
  basePrice: number
}

export const VEHICLES: Vehicle[] = [
  { id: 'gazel-15',  label: 'Газель 1.5т',    capacity: 1.5, length: 3, volume: 9,  basePrice: 25000 },
  { id: 'gazel-4m',  label: 'Газель 4м',       capacity: 1.5, length: 4, volume: 16, basePrice: 30000 },
  { id: 'furgon-3t', label: 'Фургон 3т',       capacity: 3,   length: 5, volume: 24, basePrice: 45000 },
  { id: 'euro-5t',   label: 'Еврофургон 5т',   capacity: 5,   length: 6, volume: 36, basePrice: 65000 },
]

export type PaymentMethod = 'cash' | 'card'
export type ClientType = 'individual' | 'legal'

export type ActiveDrawer = 'address' | 'vehicle' | 'options' | 'datetime' | 'payment' | null

export interface BookingOptions {
  lift: boolean
  pack: boolean
  assemble: boolean
  truck: boolean
  [key: string]: boolean
}

export const DEFAULT_OPTIONS: BookingOptions = {
  lift: false,
  pack: false,
  assemble: false,
  truck: false,
}

export interface BookingState {
  addressFrom: string
  addressTo: string
  vehicleId: string
  workers: number
  options: BookingOptions
  comment: string
  isAsap: boolean
  scheduledDate: string | null
  scheduledHour: number | null
  scheduledMinute: number | null
  payment: PaymentMethod
  phone: string
  clientType: ClientType
  companyName: string
}

export const DEFAULT_BOOKING_STATE: BookingState = {
  addressFrom: '',
  addressTo: '',
  vehicleId: VEHICLES[0].id,
  workers: 0,
  options: { ...DEFAULT_OPTIONS },
  comment: '',
  isAsap: true,
  scheduledDate: null,
  scheduledHour: null,
  scheduledMinute: null,
  payment: 'cash',
  phone: '+7',
  clientType: 'individual',
  companyName: '',
}
