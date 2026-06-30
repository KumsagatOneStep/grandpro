import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { Resend } from 'resend'
import { KZ_PHONE_RE } from '@/lib/validators'
import { VALID_PRODUCT_IDS, getProductById } from '@/lib/packing-data'

function getRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    prefix: 'grandpro:packing',
  })
}

function esc(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
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
    const { items, name, phone, deliveryType, address, comment } = body

    // 1. Basic string checks
    if (typeof name !== 'string' || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    // 2. Items array check
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    if (items.length > 50) {
      return NextResponse.json({ error: 'Too many items' }, { status: 400 })
    }
    // 3. deliveryType check
    if (typeof deliveryType !== 'string' || !['pickup', 'delivery'].includes(deliveryType)) {
      return NextResponse.json({ error: 'Invalid delivery type' }, { status: 400 })
    }
    // 4. Non-empty name/phone
    if (!name.trim() || !phone.trim()) {
      return NextResponse.json({ error: 'Name and phone required' }, { status: 400 })
    }
    // 5. Phone format
    if (!KZ_PHONE_RE.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone' }, { status: 400 })
    }
    // 6. Length limits
    if (name.length > 200 || phone.length > 50) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 })
    }
    // 7. Per-item validation
    for (const item of items) {
      if (typeof item.id !== 'string' || typeof item.qty !== 'number' || !Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > 9999) {
        return NextResponse.json({ error: 'Invalid item' }, { status: 400 })
      }
      if (!VALID_PRODUCT_IDS.has(item.id)) {
        return NextResponse.json({ error: 'Unknown product' }, { status: 400 })
      }
    }
    // 8. Address required for delivery
    if (deliveryType === 'delivery' && (!address || typeof address !== 'string' || !address.trim())) {
      return NextResponse.json({ error: 'Address required for delivery' }, { status: 400 })
    }
    // 9. Address length
    if (typeof address === 'string' && address.length > 500) {
      return NextResponse.json({ error: 'Address too long' }, { status: 400 })
    }
    // 10. Truncate comment
    const safeCommentRaw = typeof comment === 'string' ? comment.slice(0, 1000) : ''

    const safeName = esc(name.slice(0, 200))
    const safePhone = esc(phone.slice(0, 50))
    const safeAddress = typeof address === 'string' ? esc(address.slice(0, 500)) : ''
    const safeComment = safeCommentRaw ? esc(safeCommentRaw) : '—'

    // Build products table rows and compute total
    let total = 0
    const itemRows = (items as Array<{ id: string; qty: number }>).map(item => {
      const product = getProductById(item.id)!
      const lineTotal = product.price * item.qty
      total += lineTotal
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${esc(product.name)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.qty} ${esc(product.unit)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${product.price.toLocaleString('ru-RU')} ₸</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${lineTotal.toLocaleString('ru-RU')} ₸</td>
        </tr>`
    }).join('')

    const deliveryRow = deliveryType === 'pickup'
      ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Способ получения</td><td colspan="3" style="padding:8px;border-bottom:1px solid #eee;">Самовывоз</td></tr>`
      : `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Способ получения</td><td colspan="3" style="padding:8px;border-bottom:1px solid #eee;">Доставка по адресу: ${safeAddress}</td></tr>`

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'GrandPro Moving <onboarding@resend.dev>',
      to: [process.env.CONTACT_EMAIL ?? 'info@grandpro.kz'],
      subject: `Заказ упаковочных материалов — ${safeName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#7C3AED;">Заказ упаковочных материалов — GrandPro Moving</h2>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd;">Товар</th>
                <th style="padding:8px;text-align:center;border-bottom:2px solid #ddd;">Кол-во</th>
                <th style="padding:8px;text-align:right;border-bottom:2px solid #ddd;">Цена</th>
                <th style="padding:8px;text-align:right;border-bottom:2px solid #ddd;">Сумма</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
              <tr style="font-weight:700;">
                <td colspan="3" style="padding:8px;text-align:right;border-top:2px solid #ddd;">ИТОГО:</td>
                <td style="padding:8px;text-align:right;border-top:2px solid #ddd;">${total.toLocaleString('ru-RU')} ₸</td>
              </tr>
            </tbody>
          </table>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;width:160px;">Контакт</td><td style="padding:8px;border-bottom:1px solid #eee;">${safeName}, ${safePhone}</td></tr>
            ${deliveryRow}
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Комментарий</td><td style="padding:8px;border-bottom:1px solid #eee;">${safeComment}</td></tr>
          </table>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Packing order error:', error)
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
  }
}
