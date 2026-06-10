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

export async function sendContactEmail(data: ContactEmailData) {
  const name = esc(data.name.slice(0, 200))
  const phone = esc(data.phone.slice(0, 50))
  const service = data.service ? esc(data.service.slice(0, 100)) : null
  const message = data.message ? esc(data.message.slice(0, 2000)) : null

  return getResend().emails.send({
    from: 'GrandPro Moving <noreply@grandpro.kz>',
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
