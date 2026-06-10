import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { sendContactEmail } from '@/lib/email'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  prefix: 'grandpro:contact',
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  try {
    const { success } = await ratelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  } catch (e) {
    console.warn('Rate limiter unavailable:', e)
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
    if (name.length > 200 || phone.length > 50) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 })
    }
    const safeService = typeof service === 'string' ? service : undefined
    const safeMessage = typeof message === 'string' ? message : undefined

    await sendContactEmail({ name, phone, service: safeService, message: safeMessage })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
