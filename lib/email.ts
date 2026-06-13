import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

interface ContactEmailData {
  name: string
  phone: string
  service?: string
  message?: string
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

interface ServiceRequestData {
  serviceType: string
  fromAddress: string
  toAddress: string
  date: string
  name: string
  phone: string
  comment?: string
  clearService?: boolean
  upsellType?: string
  // Apartment
  rooms?: string
  packingNeeded?: boolean
  // Office
  useM2?: boolean
  m2?: string
  headcount?: string
  itEquipment?: boolean
  afterHours?: boolean
  // Floors
  floorFrom?: string
  liftFrom?: boolean
  floorToNum?: string
  liftTo?: boolean
  // Common
  heavyItems?: boolean
  needWorkers?: boolean
  // Cargo
  weight?: string
  cargoVolume?: string
  fragile?: boolean
  loadingDock?: boolean
  // International
  destCountry?: string
  needsCustoms?: boolean
  // Rigging
  equipmentType?: string
  equipmentWeight?: string
  needsCrane?: boolean
  // Packing
  fragileInventory?: boolean
  // B2B
  companyName?: string
}

const SERVICE_LABELS: Record<string, string> = {
  apartment: 'Квартирный переезд', office: 'Офисный переезд',
  cargo: 'Грузоперевозки', international: 'Международный',
  rigging: 'Такелаж', packing: 'Упаковка',
}

const EQUIPMENT_LABELS: Record<string, string> = {
  safe: 'Сейф', piano: 'Пианино / рояль',
  machine: 'Станок / оборудование', atm: 'Банкомат / терминал', other: 'Другое',
}

export async function sendServiceRequestEmail(data: ServiceRequestData) {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;width:180px;color:#374151;">${label}</td><td style="padding:8px;border-bottom:1px solid #eee;color:#111827;">${value}</td></tr>`

  const yn = (v: boolean | undefined) => v ? '✅ Да' : '—'
  const orDash = (v: string | undefined) => v ? esc(v) : '—'

  const name = esc(data.name.slice(0, 200))
  const phone = esc(data.phone.slice(0, 50))

  // Build service-specific detail rows
  const typeRows: string[] = []
  const type = data.serviceType

  if (type === 'apartment') {
    if (data.rooms) typeRows.push(row('Комнат', esc(data.rooms)))
    typeRows.push(row('Крупногабаритные', yn(data.heavyItems)))
    typeRows.push(row('Грузчики', yn(data.needWorkers)))
    typeRows.push(row('Упаковка', yn(data.packingNeeded)))
  } else if (type === 'office') {
    if (data.useM2) typeRows.push(row('Площадь', orDash(data.m2) + ' м²'))
    else typeRows.push(row('Рабочих мест', orDash(data.headcount)))
    typeRows.push(row('IT-оборудование', yn(data.itEquipment)))
    typeRows.push(row('Грузчики', yn(data.needWorkers)))
    typeRows.push(row('Ночь/выходные', yn(data.afterHours)))
    if (data.companyName) typeRows.push(row('Компания', esc(data.companyName)))
  } else if (type === 'cargo') {
    if (data.weight) typeRows.push(row('Вес', esc(data.weight) + ' кг'))
    if (data.cargoVolume) typeRows.push(row('Объём', esc(data.cargoVolume) + ' м³'))
    typeRows.push(row('Хрупкий груз', yn(data.fragile)))
    typeRows.push(row('Рампа/доки', yn(data.loadingDock)))
    typeRows.push(row('Грузчики', yn(data.needWorkers)))
    if (data.companyName) typeRows.push(row('Компания', esc(data.companyName)))
  } else if (type === 'international') {
    if (data.destCountry) typeRows.push(row('Страна назначения', esc(data.destCountry)))
    if (data.cargoVolume) typeRows.push(row('Объём', esc(data.cargoVolume) + ' м³'))
    if (data.weight) typeRows.push(row('Вес', esc(data.weight) + ' кг'))
    typeRows.push(row('Таможня', yn(data.needsCustoms)))
    typeRows.push(row('Хрупкий груз', yn(data.fragile)))
    if (data.companyName) typeRows.push(row('Компания', esc(data.companyName)))
  } else if (type === 'rigging') {
    typeRows.push(row('Тип', EQUIPMENT_LABELS[data.equipmentType ?? ''] ?? orDash(data.equipmentType)))
    if (data.equipmentWeight) typeRows.push(row('Вес', esc(data.equipmentWeight) + ' кг'))
    typeRows.push(row('Кран/подъёмник', yn(data.needsCrane)))
  } else if (type === 'packing') {
    if (data.rooms) typeRows.push(row('Комнат', esc(data.rooms)))
    typeRows.push(row('Хрупкие предметы', yn(data.fragileInventory)))
    typeRows.push(row('Крупногабаритные', yn(data.heavyItems)))
  }

  // Floor rows for types that collect floor data
  if (['apartment', 'office', 'rigging'].includes(type)) {
    if (data.floorFrom)
      typeRows.push(row('Этаж (погрузка)', `${esc(data.floorFrom)} ${data.liftFrom ? '(лифт ✅)' : '(лифта нет)'}`))
    if (data.floorToNum)
      typeRows.push(row('Этаж (выгрузка)', `${esc(data.floorToNum)} ${data.liftTo ? '(лифт ✅)' : '(лифта нет)'}`))
  }

  const upsellTag = data.upsellType
    ? `<p style="background:#E0F2FE;padding:10px;border-radius:6px;margin-bottom:12px;"><strong>➕ Доп. услуга: ${esc(data.upsellType)}</strong></p>`
    : data.clearService
    ? '<p style="background:#FFF3CD;padding:10px;border-radius:6px;margin-bottom:12px;"><strong>✨ Клиент добавил Clear Service</strong></p>'
    : ''

  return getResend().emails.send({
    from: 'GrandPro Moving <onboarding@resend.dev>',
    to: [process.env.CONTACT_EMAIL ?? 'info@grandpro.kz'],
    subject: `${data.clearService || data.upsellType ? '[UPSELL] ' : ''}Заявка: ${SERVICE_LABELS[type] ?? type} — ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:640px;margin:0 auto;">
        <h2 style="color:#0369A1;margin-bottom:16px;">Новая заявка — GrandPro Moving</h2>
        ${upsellTag}
        <table style="width:100%;border-collapse:collapse;">
          ${row('Услуга', SERVICE_LABELS[type] ?? esc(type))}
          ${row('Имя', name)}
          ${row('Телефон', phone)}
          ${row('Откуда', esc(data.fromAddress))}
          ${row('Куда', esc(data.toAddress))}
          ${row('Дата', esc(data.date) || 'Не указана')}
          ${typeRows.join('')}
          ${data.comment ? row('Комментарий', esc(data.comment.slice(0, 2000))) : ''}
        </table>
      </div>
    `,
  })
}

export async function sendContactEmail(data: ContactEmailData) {
  const name = esc(data.name.slice(0, 200))
  const phone = esc(data.phone.slice(0, 50))
  const service = data.service ? esc(data.service.slice(0, 100)) : null
  const message = data.message ? esc(data.message.slice(0, 2000)) : null

  return getResend().emails.send({
    from: 'GrandPro Moving <onboarding@resend.dev>',
    to: [process.env.CONTACT_EMAIL ?? 'info@grandpro.kz'],
    subject: `Новая заявка от ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0369A1;">Новая заявка с сайта GrandPro Moving</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Имя:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Телефон:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${phone}</td>
          </tr>
          ${service ? `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Услуга:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${service}</td>
          </tr>` : ''}
          ${message ? `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Сообщение:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${message}</td>
          </tr>` : ''}
        </table>
      </div>
    `,
  })
}
