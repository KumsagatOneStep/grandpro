import { NextRequest, NextResponse } from 'next/server'
import { sendContactEmail } from '@/lib/email'

// In-memory rate limiter: max 5 requests per IP per 60 seconds
const rateMap = new Map<string, { count: number; reset: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + 60_000 })
    return false
  }
  if (entry.count >= 5) return true
  entry.count++
  return false
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
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

    await sendContactEmail({ name, phone, service, message })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
