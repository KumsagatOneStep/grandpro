import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { sendContactEmail } from '@/lib/email'
import { KZ_PHONE_RE } from '@/lib/validators'

function getRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    prefix: 'grandpro:contact',
  })
}

const VALID_SERVICES = new Set([
  'apartment', 'office', 'international', 'rigging', 'packing', 'storage', 'booking',
])

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const rl = getRatelimit()
  if (rl) {
    const { success } = await rl.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  try {
    const body = await request.json()
    const { name, phone, service, message } = body

    if (typeof name !== 'string' || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    if (!name.trim() || !phone.trim()) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }
    if (!KZ_PHONE_RE.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 })
    }
    if (name.length > 200 || phone.length > 50) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 })
    }

    // enum validation for service
    const safeService = typeof service === 'string' && VALID_SERVICES.has(service)
      ? service
      : undefined

    const safeMessage = typeof message === 'string'
      ? message.slice(0, 3000)
      : undefined

    await sendContactEmail({ name, phone, service: safeService, message: safeMessage })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
