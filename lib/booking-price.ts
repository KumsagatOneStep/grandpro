export const WORKER_PRICE = 5000

export const BOOKING_OPTION_PRICES: Record<string, number> = {
  lift: 8000,
  pack: 15000,
  assemble: 10000,
  truck: 20000,
}

export interface CalcInput {
  vehicleBasePrice: number
  workers: number
  options: Record<string, boolean>
}

export function calcBookingPrice({ vehicleBasePrice, workers, options }: CalcInput): number {
  const workersTotal = workers * WORKER_PRICE
  const optsTotal = Object.entries(options)
    .filter(([, v]) => v)
    .reduce((sum, [k]) => sum + (BOOKING_OPTION_PRICES[k] ?? 0), 0)
  return vehicleBasePrice + workersTotal + optsTotal
}
