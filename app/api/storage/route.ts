import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { Resend } from 'resend'
import { KZ_PHONE_RE } from '@/lib/validators'
import {
  VALID_BOX_IDS, VALID_LOCATION_IDS, VALID_DURATIONS,
  getBoxById, getLocationById, type PricingKey,
} from '@/lib/storage-data'

function getRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    prefix: 'grandpro:storage',
  })
}

function esc(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const rl = getRatelimit()
  if (rl) {
    try {
      const { success } = await rl.limit(ip)
      if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    } catch {
      // Redis unavailable — allow request through
    }
  }

  try {
    const body = await request.json()
    const { boxId, locationId, duration, name, phone, comment } = body

    if (typeof name !== 'string' || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    if (!name.trim() || !phone.trim()) {
      return NextResponse.json({ error: 'Name and phone required' }, { status: 400 })
    }
    if (!KZ_PHONE_RE.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone' }, { status: 400 })
    }
    if (name.length > 200) {
      return NextResponse.json({ error: 'Name too long' }, { status: 400 })
    }
    if (!VALID_BOX_IDS.has(boxId)) {
      return NextResponse.json({ error: 'Invalid box' }, { status: 400 })
    }
    if (!VALID_LOCATION_IDS.has(locationId)) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 })
    }
    if (!VALID_DURATIONS.has(duration)) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
    }

    const box = getBoxById(boxId)!
    const location = getLocationById(locationId)!
    const priceKey = `m${duration}` as PricingKey
    const pricePerMonth = box.pricing[priceKey]
    const safeName = esc(name.slice(0, 200))
    const safePhone = esc(phone.slice(0, 50))
    const safeComment = typeof comment === 'string' ? esc(comment.slice(0, 1000)) : '—'

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'GrandPro Moving <onboarding@resend.dev>',
      to: [process.env.CONTACT_EMAIL ?? 'info@grandpro.kz'],
      subject: `Аренда ${box.number} (${location.name} · ${box.area} м² · ${duration} мес) — ${safeName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#0369A1;">Заявка на аренду склада — GrandPro Moving</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;width:160px;">Локация</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(location.name)}, ${esc(location.address)}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Бокс</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(box.number)}, этаж ${box.floor}, ${box.area} м² (${box.size})</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Срок</td><td style="padding:8px;border-bottom:1px solid #eee;">${duration} мес → ${pricePerMonth.toLocaleString('ru-RU')} ₸/мес</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Имя</td><td style="padding:8px;border-bottom:1px solid #eee;">${safeName}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Телефон</td><td style="padding:8px;border-bottom:1px solid #eee;">${safePhone}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Комментарий</td><td style="padding:8px;border-bottom:1px solid #eee;">${safeComment}</td></tr>
          </table>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Storage booking error:', error)
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
  }
}
