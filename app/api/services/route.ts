import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { sendServiceRequestEmail } from '@/lib/email'
import { KZ_PHONE_RE } from '@/lib/validators'

function getRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    prefix: 'grandpro:services',
  })
}

const VALID_SERVICE_TYPES = new Set([
  'apartment', 'office', 'cargo', 'international', 'rigging', 'packing',
])

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const rl = getRatelimit()
  if (rl) {
    try {
      const { success } = await rl.limit(ip)
      if (!success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
    } catch {
      // Redis unavailable — allow request through
    }
  }

  try {
    const body = await request.json()
    const { name, phone, fromAddress, toAddress, serviceType } = body

    if (typeof name !== 'string' || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    if (!name.trim() || !phone.trim()) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }
    if (!KZ_PHONE_RE.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 })
    }
    if (typeof fromAddress !== 'string' || !fromAddress.trim()) {
      return NextResponse.json({ error: 'From address is required' }, { status: 400 })
    }
    if (typeof toAddress !== 'string' || !toAddress.trim()) {
      return NextResponse.json({ error: 'To address is required' }, { status: 400 })
    }
    if (name.length > 200 || phone.length > 50) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 })
    }

    const str = (v: unknown, max = 500) =>
      typeof v === 'string' ? v.slice(0, max) : ''
    const bool = (v: unknown) => Boolean(v)

    await sendServiceRequestEmail({
      serviceType: VALID_SERVICE_TYPES.has(serviceType) ? String(serviceType) : 'apartment',
      fromAddress: str(fromAddress),
      toAddress: str(toAddress),
      date: str(body.date, 30),
      name,
      phone,
      comment: str(body.comment, 2000) || undefined,
      clearService: bool(body.clearService),
      upsellType: str(body.upsellType, 50) || undefined,
      // Apartment
      rooms: str(body.rooms, 10),
      packingNeeded: bool(body.packingNeeded),
      // Office
      useM2: bool(body.useM2),
      m2: str(body.m2, 20),
      headcount: str(body.headcount, 20),
      itEquipment: bool(body.itEquipment),
      afterHours: bool(body.afterHours),
      // Floors
      floorFrom: str(body.floorFrom, 10),
      liftFrom: bool(body.liftFrom),
      floorToNum: str(body.floorToNum, 10),
      liftTo: bool(body.liftTo),
      // Common
      heavyItems: bool(body.heavyItems),
      needWorkers: bool(body.needWorkers),
      // Cargo
      weight: str(body.weight, 20),
      cargoVolume: str(body.cargoVolume, 20),
      fragile: bool(body.fragile),
      loadingDock: bool(body.loadingDock),
      // International
      destCountry: str(body.destCountry, 100),
      needsCustoms: bool(body.needsCustoms),
      // Rigging
      equipmentType: str(body.equipmentType, 50),
      equipmentWeight: str(body.equipmentWeight, 20),
      needsCrane: bool(body.needsCrane),
      // Packing
      fragileInventory: bool(body.fragileInventory),
      // B2B
      companyName: str(body.companyName, 200),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Service request error:', error)
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
  }
}
