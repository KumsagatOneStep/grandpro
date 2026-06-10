import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function RootPage() {
  const headersList = await headers()
  const acceptLang = headersList.get('accept-language') ?? ''

  if (/\bkk\b/i.test(acceptLang)) redirect('/kz')
  if (/\ben\b/i.test(acceptLang)) redirect('/en')
  redirect('/ru')
}
