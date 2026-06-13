'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Building2, Truck, Globe, Wrench, Package,
  ArrowRight, ChevronLeft, Check, Sparkles, Star,
  Calendar, ChevronDown, Trash2, Zap, PackageCheck,
} from 'lucide-react'
import { KZ_PHONE_RE } from '@/lib/validators'

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceType = 'apartment' | 'office' | 'cargo' | 'international' | 'rigging' | 'packing'
type WizardStep = 1 | 2 | 3 | 'success'

interface FormState {
  serviceType: ServiceType | ''
  fromAddress: string
  toAddress: string
  date: string
  // Apartment
  rooms: string
  packingNeeded: boolean
  // Office
  useM2: boolean
  m2: string
  headcount: string
  itEquipment: boolean
  afterHours: boolean
  // Common floor/lift
  floorFrom: string
  liftFrom: boolean
  floorToNum: string
  liftTo: boolean
  // Common toggles
  heavyItems: boolean
  needWorkers: boolean
  // Cargo
  weight: string
  cargoVolume: string
  fragile: boolean
  loadingDock: boolean
  // International
  destCountry: string
  needsCustoms: boolean
  // Rigging
  equipmentType: string
  equipmentWeight: string
  needsCrane: boolean
  // Packing
  fragileInventory: boolean
  // Contacts
  name: string
  phone: string
  comment: string
  companyName: string
}

const INITIAL: FormState = {
  serviceType: '', fromAddress: '', toAddress: '', date: '',
  rooms: '', packingNeeded: false,
  useM2: false, m2: '', headcount: '', itEquipment: false, afterHours: false,
  floorFrom: '', liftFrom: false, floorToNum: '', liftTo: false,
  heavyItems: false, needWorkers: false,
  weight: '', cargoVolume: '', fragile: false, loadingDock: false,
  destCountry: '', needsCustoms: false,
  equipmentType: '', equipmentWeight: '', needsCrane: false,
  fragileInventory: false,
  name: '', phone: '', comment: '', companyName: '',
}

// ─── Smart trigger logic ──────────────────────────────────────────────────────

interface UpsellCard {
  id: string
  icon: React.ElementType
  title: string
  desc: string
  price: string
}

function getUpsellCards(form: FormState): UpsellCard[] {
  const cards: UpsellCard[] = []
  const rooms = parseInt(form.rooms) || 0
  const m2 = parseInt(form.m2) || 0
  const daysUntil = form.date
    ? Math.ceil((new Date(form.date).getTime() - Date.now()) / 86_400_000)
    : 999

  if (rooms >= 3 || m2 >= 60) {
    cards.push({
      id: 'packing_cleaning',
      icon: PackageCheck,
      title: 'Упаковка + уборка',
      desc: 'Запакуем всё профессионально и уберём после переезда',
      price: 'от 18 000 ₸',
    })
  }
  if (form.heavyItems) {
    cards.push({
      id: 'junk_removal',
      icon: Trash2,
      title: 'Вывоз ненужного',
      desc: 'Старая мебель, техника, мусор — заберём со старого места',
      price: 'от 8 000 ₸',
    })
  }
  if (daysUntil >= 0 && daysUntil <= 3) {
    cards.push({
      id: 'express_packing',
      icon: Zap,
      title: 'Срочная упаковка',
      desc: 'Дата близко — наша бригада упакует всё за вас сегодня',
      price: 'от 12 000 ₸',
    })
  }
  return cards.slice(0, 2)
}

const B2B_TYPES: ServiceType[] = ['office', 'cargo', 'international']

// ─── UI helpers ───────────────────────────────────────────────────────────────

function InputField({
  label, value, onChange, placeholder, type = 'text', required, error,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean; error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {label}{required && <span style={{ color: '#DC2626' }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
        style={{
          background: 'var(--bg-surface-elevated)',
          border: `1.5px solid ${error ? '#DC2626' : 'var(--color-border)'}`,
          color: 'var(--color-text)',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = error ? '#DC2626' : 'var(--color-primary)')}
        onBlur={e => (e.currentTarget.style.borderColor = error ? '#DC2626' : 'var(--color-border)')}
      />
      {error && <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="w-10 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0"
        style={{ background: checked ? 'var(--color-primary)' : 'var(--color-border)' }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: checked ? '18px' : '2px' }}
        />
      </button>
      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
    </label>
  )
}

function SelectField({
  label, value, onChange, options, required, error,
}: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
  required?: boolean; error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {label}{required && <span style={{ color: '#DC2626' }}> *</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none transition-all duration-200"
          style={{
            background: 'var(--bg-surface-elevated)',
            border: `1.5px solid ${error ? '#DC2626' : 'var(--color-border)'}`,
            color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
          }}
        >
          <option value="">— выберите</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--color-text-muted)' }} />
      </div>
      {error && <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>}
    </div>
  )
}

function FloorBlock({
  form, set,
}: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-3">
        <InputField label="Этаж (погрузка)" value={form.floorFrom}
          onChange={v => set('floorFrom', v)} placeholder="напр. 5" />
        <Toggle checked={form.liftFrom} onChange={v => set('liftFrom', v)} label="Лифт есть" />
      </div>
      <div className="flex flex-col gap-3">
        <InputField label="Этаж (выгрузка)" value={form.floorToNum}
          onChange={v => set('floorToNum', v)} placeholder="напр. 3" />
        <Toggle checked={form.liftTo} onChange={v => set('liftTo', v)} label="Лифт есть" />
      </div>
    </div>
  )
}

// ─── Dynamic Step 2 content per service type ─────────────────────────────────

function Step2Content({
  form, set, errors,
}: {
  form: FormState
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  errors: Partial<Record<keyof FormState, string>>
}) {
  const type = form.serviceType

  if (type === 'apartment') return (
    <div className="flex flex-col gap-5">
      <SelectField
        label="Количество комнат" value={form.rooms} onChange={v => set('rooms', v)} required
        error={errors.rooms}
        options={['1', '2', '3', '4', '5+'].map(v => ({ value: v, label: `${v} комн.` }))}
      />
      <FloorBlock form={form} set={set} />
      <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: 'var(--bg-surface-elevated)' }}>
        <Toggle checked={form.heavyItems} onChange={v => set('heavyItems', v)}
          label="Есть тяжёлые предметы (пианино, сейф)" />
        <Toggle checked={form.needWorkers} onChange={v => set('needWorkers', v)} label="Нужны грузчики" />
        <Toggle checked={form.packingNeeded} onChange={v => set('packingNeeded', v)} label="Нужна упаковка вещей" />
      </div>
    </div>
  )

  if (type === 'office') return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--bg-surface-elevated)' }}>
        {[{ label: 'Кол-во мест', val: false }, { label: 'Площадь м²', val: true }].map(opt => (
          <button
            key={String(opt.val)} type="button"
            onClick={() => set('useM2', opt.val)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              background: form.useM2 === opt.val ? 'var(--color-primary)' : 'transparent',
              color: form.useM2 === opt.val ? 'white' : 'var(--color-text-muted)',
            }}
          >{opt.label}</button>
        ))}
      </div>
      {form.useM2
        ? <InputField label="Площадь" value={form.m2} onChange={v => set('m2', v)} placeholder="напр. 150 м²" />
        : <InputField label="Рабочих мест" value={form.headcount} onChange={v => set('headcount', v)} placeholder="напр. 20 человек" />
      }
      <FloorBlock form={form} set={set} />
      <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: 'var(--bg-surface-elevated)' }}>
        <Toggle checked={form.itEquipment} onChange={v => set('itEquipment', v)}
          label="Есть IT-оборудование (серверы, ПК)" />
        <Toggle checked={form.needWorkers} onChange={v => set('needWorkers', v)} label="Нужны грузчики" />
        <Toggle checked={form.afterHours} onChange={v => set('afterHours', v)}
          label="Нужна работа ночью / в выходные" />
      </div>
    </div>
  )

  if (type === 'cargo') return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Вес (кг)" value={form.weight}
          onChange={v => set('weight', v)} placeholder="напр. 500" />
        <InputField label="Объём (м³)" value={form.cargoVolume}
          onChange={v => set('cargoVolume', v)} placeholder="напр. 10" />
      </div>
      <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: 'var(--bg-surface-elevated)' }}>
        <Toggle checked={form.fragile} onChange={v => set('fragile', v)} label="Хрупкий груз" />
        <Toggle checked={form.loadingDock} onChange={v => set('loadingDock', v)}
          label="Есть погрузочная рампа/доки" />
        <Toggle checked={form.needWorkers} onChange={v => set('needWorkers', v)} label="Нужны грузчики" />
      </div>
    </div>
  )

  if (type === 'international') return (
    <div className="flex flex-col gap-5">
      <InputField label="Страна назначения" value={form.destCountry}
        onChange={v => set('destCountry', v)} placeholder="напр. Россия, Германия" required
        error={errors.destCountry} />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Объём (м³)" value={form.cargoVolume}
          onChange={v => set('cargoVolume', v)} placeholder="напр. 20" />
        <InputField label="Вес (кг)" value={form.weight}
          onChange={v => set('weight', v)} placeholder="напр. 1000" />
      </div>
      <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: 'var(--bg-surface-elevated)' }}>
        <Toggle checked={form.needsCustoms} onChange={v => set('needsCustoms', v)}
          label="Нужно таможенное оформление" />
        <Toggle checked={form.fragile} onChange={v => set('fragile', v)} label="Есть хрупкие вещи" />
      </div>
    </div>
  )

  if (type === 'rigging') return (
    <div className="flex flex-col gap-5">
      <SelectField
        label="Тип оборудования" value={form.equipmentType}
        onChange={v => set('equipmentType', v)} required error={errors.equipmentType}
        options={[
          { value: 'safe', label: 'Сейф' },
          { value: 'piano', label: 'Пианино / рояль' },
          { value: 'machine', label: 'Станок / оборудование' },
          { value: 'atm', label: 'Банкомат / терминал' },
          { value: 'other', label: 'Другое' },
        ]}
      />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Вес (кг)" value={form.equipmentWeight}
          onChange={v => set('equipmentWeight', v)} placeholder="напр. 300" />
        <InputField label="Этаж" value={form.floorFrom}
          onChange={v => set('floorFrom', v)} placeholder="напр. 3" />
      </div>
      <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: 'var(--bg-surface-elevated)' }}>
        <Toggle checked={form.needsCrane} onChange={v => set('needsCrane', v)}
          label="Нужен кран / подъёмник" />
        <Toggle checked={form.liftFrom} onChange={v => set('liftFrom', v)} label="Есть лифт" />
      </div>
    </div>
  )

  if (type === 'packing') return (
    <div className="flex flex-col gap-5">
      <SelectField
        label="Количество комнат" value={form.rooms} onChange={v => set('rooms', v)} required
        error={errors.rooms}
        options={['1', '2', '3', '4', '5+'].map(v => ({ value: v, label: `${v} комн.` }))}
      />
      <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: 'var(--bg-surface-elevated)' }}>
        <Toggle checked={form.fragileInventory} onChange={v => set('fragileInventory', v)}
          label="Есть хрупкие предметы (посуда, картины)" />
        <Toggle checked={form.heavyItems} onChange={v => set('heavyItems', v)}
          label="Есть крупногабаритные вещи" />
      </div>
    </div>
  )

  return null
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: WizardStep }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {([1, 2, 3] as const).map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
            style={{
              background: step === 'success' || (typeof step === 'number' && step >= s)
                ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
              color: step === 'success' || (typeof step === 'number' && step >= s)
                ? 'white' : 'var(--color-text-muted)',
            }}
          >
            {step === 'success' || (typeof step === 'number' && step > s) ? <Check size={14} /> : s}
          </div>
          {i < 2 && (
            <div className="w-12 h-0.5 rounded-full transition-all duration-300"
              style={{ background: step === 'success' || (typeof step === 'number' && step > s + 1) ? 'var(--color-primary)' : 'var(--color-border)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const SERVICE_ICONS: Record<ServiceType, React.ElementType> = {
  apartment: Home, office: Building2, cargo: Truck,
  international: Globe, rigging: Wrench, packing: Package,
}
const SERVICE_COLORS: Record<ServiceType, string> = {
  apartment: '#0369A1', office: '#7C3AED', cargo: '#D97706',
  international: '#059669', rigging: '#DC2626', packing: '#0891B2',
}
const PLAN_KEYS = ['start', 'business', 'corporate'] as const

export function ServicesPageClient() {
  const t = useTranslations('servicesPage')
  const [step, setStep] = useState<WizardStep>(1)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [addedUpsells, setAddedUpsells] = useState<Set<string>>(new Set())
  const [dismissedUpsells, setDismissedUpsells] = useState<Set<string>>(new Set())

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  const isB2B = B2B_TYPES.includes(form.serviceType as ServiceType)
  const upsellCards = step === 'success'
    ? getUpsellCards(form).filter(c => !dismissedUpsells.has(c.id))
    : []

  const validateStep1 = () => {
    const e: typeof errors = {}
    if (!form.serviceType) e.serviceType = t('wizard.required')
    if (!form.fromAddress.trim()) e.fromAddress = t('wizard.required')
    if (!form.toAddress.trim()) e.toAddress = t('wizard.required')
    setErrors(e)
    return !Object.keys(e).length
  }

  const validateStep2 = () => {
    const e: typeof errors = {}
    const type = form.serviceType
    if ((type === 'apartment' || type === 'packing') && !form.rooms)
      e.rooms = t('wizard.required')
    if (type === 'rigging' && !form.equipmentType)
      e.equipmentType = t('wizard.required')
    if (type === 'international' && !form.destCountry.trim())
      e.destCountry = t('wizard.required')
    setErrors(e)
    return !Object.keys(e).length
  }

  const validateStep3 = () => {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = t('wizard.required')
    if (!form.phone.trim()) e.phone = t('wizard.required')
    else if (!KZ_PHONE_RE.test(form.phone)) e.phone = t('wizard.phoneInvalid')
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async () => {
    if (!validateStep3()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      setStep('success')
    } catch {
      setSubmitError('Не удалось отправить заявку. Попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddUpsell = async (id: string) => {
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          clearService: true,
          upsellType: id !== 'clear_service' ? id : undefined,
        }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      setAddedUpsells(s => new Set(s).add(id))
    } catch {
      // don't mark as added on failure
    }
  }

  const serviceTypes: ServiceType[] = ['apartment', 'office', 'cargo', 'international', 'rigging', 'packing']

  return (
    <>
      {/* ── Hero ── */}
      <section className="pt-36 pb-20 px-6" style={{ background: 'var(--gradient-hero)' }}>
        <div className="max-w-[1280px] mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl md:text-6xl font-extrabold mb-6 tracking-tight"
            style={{ color: 'var(--color-text)' }}
          >
            {t('hero.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.a
            href="#request" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-lg"
            style={{ background: 'var(--gradient-primary)' }}
          >
            {t('hero.cta')} <ArrowRight size={20} />
          </motion.a>
        </div>
      </section>

      {/* ── Service cards ── */}
      <section className="py-16 px-6" style={{ background: 'var(--bg-main)' }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {serviceTypes.map((type, i) => {
              const Icon = SERVICE_ICONS[type]
              const color = SERVICE_COLORS[type]
              const active = form.serviceType === type
              return (
                <motion.button
                  key={type} type="button"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    set('serviceType', type)
                    document.getElementById('request')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl text-center cursor-pointer transition-all duration-200 hover:-translate-y-1"
                  style={{
                    background: active ? `${color}18` : 'var(--bg-surface)',
                    border: `1.5px solid ${active ? color : 'var(--color-border)'}`,
                    boxShadow: active ? `0 4px 20px ${color}30` : 'none',
                  }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}18`, color }}>
                    <Icon size={22} />
                  </div>
                  <span className="text-xs font-semibold leading-tight"
                    style={{ color: active ? color : 'var(--color-text)' }}>
                    {t(`cards.${type}.title`)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t(`cards.${type}.desc`)}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Wizard ── */}
      <section id="request" className="py-16 px-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl font-extrabold mb-2 text-center" style={{ color: 'var(--color-text)' }}>
            {t('wizard.title')}
          </h2>
          <p className="text-center mb-10 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {step === 'success'
              ? t('success.subtitle')
              : step === 1 ? t('wizard.step1')
              : step === 2 ? t('wizard.step2')
              : t('wizard.step3')}
          </p>

          {step !== 'success' && <StepIndicator step={step} />}

          <AnimatePresence mode="wait">

            {/* Step 1 */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="flex flex-col gap-5">
                <SelectField
                  label={t('wizard.serviceType')} value={form.serviceType}
                  onChange={v => set('serviceType', v as ServiceType)} required
                  error={errors.serviceType}
                  options={serviceTypes.map(type => ({ value: type, label: t(`cards.${type}.title`) }))}
                />
                <InputField label={t('wizard.fromAddress')} value={form.fromAddress}
                  onChange={v => set('fromAddress', v)} required placeholder="ул. Абая 1, Алматы"
                  error={errors.fromAddress} />
                <InputField label={t('wizard.toAddress')} value={form.toAddress}
                  onChange={v => set('toAddress', v)} required placeholder="пр. Достык 123, Алматы"
                  error={errors.toAddress} />
                <InputField label={t('wizard.date')} value={form.date}
                  onChange={v => set('date', v)} type="date" />
                <button type="button" onClick={() => validateStep1() && setStep(2)}
                  className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--gradient-primary)' }}>
                  {t('wizard.next')} <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {/* Step 2 — dynamic per service type */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="flex flex-col gap-5">

                {/* Service type badge */}
                {form.serviceType && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold w-fit"
                    style={{ background: `${SERVICE_COLORS[form.serviceType]}18`, color: SERVICE_COLORS[form.serviceType] }}>
                    {(() => { const Icon = SERVICE_ICONS[form.serviceType as ServiceType]; return <Icon size={14} /> })()}
                    {t(`cards.${form.serviceType}.title`)}
                  </div>
                )}

                <Step2Content form={form} set={set} errors={errors} />

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-none px-5 py-4 rounded-2xl font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--bg-surface-elevated)', color: 'var(--color-text-muted)' }}>
                    <ChevronLeft size={18} /> {t('wizard.back')}
                  </button>
                  <button type="button" onClick={() => validateStep2() && setStep(3)}
                    className="flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    style={{ background: 'var(--gradient-primary)' }}>
                    {t('wizard.next')} <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — contacts */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="flex flex-col gap-5">
                <InputField label={t('wizard.name')} value={form.name}
                  onChange={v => set('name', v)} required placeholder="Иван Петров"
                  error={errors.name} />
                <InputField label={t('wizard.phone')} value={form.phone}
                  onChange={v => set('phone', v)} required placeholder="+7 777 123 45 67"
                  type="tel" error={errors.phone} />
                {isB2B && (
                  <InputField label="Название компании" value={form.companyName}
                    onChange={v => set('companyName', v)} placeholder="ТОО «Название»" />
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {t('wizard.comment')}
                  </label>
                  <textarea value={form.comment} onChange={e => set('comment', e.target.value)}
                    placeholder={t('wizard.commentPlaceholder')} rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all duration-200"
                    style={{ background: 'var(--bg-surface-elevated)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')} />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex-none px-5 py-4 rounded-2xl font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--bg-surface-elevated)', color: 'var(--color-text-muted)' }}>
                    <ChevronLeft size={18} /> {t('wizard.back')}
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={submitting}
                    className="flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ background: 'var(--gradient-primary)' }}>
                    {submitting ? t('wizard.submitting') : t('wizard.submit')}
                    {!submitting && <ArrowRight size={18} />}
                  </button>
                </div>
                {submitError && (
                  <p className="text-sm text-center" style={{ color: '#DC2626' }}>{submitError}</p>
                )}
              </motion.div>
            )}

            {/* Success */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-6">
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: '#05966918', color: '#059669' }}>
                    <Check size={32} />
                  </div>
                  <h3 className="font-heading text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                    {t('success.title')}
                  </h3>
                </div>

                {/* B2B → show subscription pitch */}
                {isB2B ? (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-3xl p-6" style={{ background: 'var(--bg-surface-elevated)', border: '1.5px solid var(--color-border)' }}>
                    <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-primary)' }}>Для бизнеса</p>
                    <h4 className="font-heading text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                      Подключите подписку и экономьте
                    </h4>
                    <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                      Фиксированная плата — без сюрпризов. До 40 поездок в месяц, персональный менеджер.
                    </p>
                    <a href="#subscription"
                      onClick={() => document.getElementById('subscription')?.scrollIntoView({ behavior: 'smooth' })}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white text-sm"
                      style={{ background: 'var(--gradient-primary)' }}>
                      Смотреть тарифы <ArrowRight size={16} />
                    </a>
                  </motion.div>
                ) : (
                  /* B2C → smart upsell cards */
                  upsellCards.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      <p className="text-sm font-semibold text-center" style={{ color: 'var(--color-text-muted)' }}>
                        Добавьте к заявке
                      </p>
                      {upsellCards.map((card, i) => {
                        const Icon = card.icon
                        const added = addedUpsells.has(card.id)
                        return (
                          <motion.div key={card.id}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                            className="flex items-center gap-4 p-4 rounded-2xl"
                            style={{ background: 'var(--bg-surface-elevated)', border: '1.5px solid var(--color-border)' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: 'var(--active-badge)', color: 'var(--color-primary)' }}>
                              <Icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{card.title}</p>
                              <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{card.desc}</p>
                              <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--color-primary)' }}>{card.price}</p>
                            </div>
                            {added ? (
                              <span className="text-xs font-bold flex items-center gap-1 flex-shrink-0"
                                style={{ color: '#059669' }}>
                                <Check size={14} /> Добавлено
                              </span>
                            ) : (
                              <div className="flex flex-col gap-1.5 flex-shrink-0">
                                <button type="button" onClick={() => handleAddUpsell(card.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-opacity"
                                  style={{ background: 'var(--gradient-primary)' }}>
                                  Добавить
                                </button>
                                <button type="button"
                                  onClick={() => setDismissedUpsells(s => new Set(s).add(card.id))}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity text-center"
                                  style={{ color: 'var(--color-text-muted)' }}>
                                  Нет
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : !dismissedUpsells.has('clear_service') ? (
                    /* No triggers fired — show general Clear Service */
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="rounded-3xl p-6"
                      style={{ background: 'linear-gradient(135deg,#0369A118,#0EA5E918)', border: '1.5px solid var(--color-primary)' }}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--color-primary)', color: 'white' }}>
                          <Sparkles size={22} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-heading text-lg font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                            {t('clear.title')}
                          </h4>
                          <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                            {t('clear.subtitle')}
                          </p>
                          <p className="font-bold mb-4" style={{ color: 'var(--color-primary)' }}>{t('clear.price')}</p>
                          <div className="flex gap-3">
                            <button type="button" onClick={() => handleAddUpsell('clear_service')}
                              className="flex-1 py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-opacity"
                              style={{ background: 'var(--gradient-primary)' }}>
                              {addedUpsells.has('clear_service') ? t('clear.added') : t('clear.add')}
                            </button>
                            <button type="button"
                              onClick={() => setDismissedUpsells(s => new Set(s).add('clear_service'))}
                              className="px-4 py-3 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
                              style={{ background: 'var(--bg-surface-elevated)', color: 'var(--color-text-muted)' }}>
                              {t('clear.skip')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </section>

      {/* ── Subscription ── */}
      <section id="subscription" className="py-20 px-6" style={{ background: 'var(--bg-main)' }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>
              {t('subscription.title')}
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              {t('subscription.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLAN_KEYS.map((key, i) => {
              const isPopular = key === 'business'
              return (
                <motion.div key={key}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-3xl p-8 flex flex-col relative"
                  style={{
                    background: isPopular ? 'var(--gradient-primary)' : 'var(--bg-surface)',
                    border: isPopular ? 'none' : '1px solid var(--color-border)',
                    boxShadow: isPopular ? '0 20px 60px var(--shadow-main)' : 'none',
                    transform: isPopular ? 'scale(1.04)' : undefined,
                  }}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white"
                      style={{ color: 'var(--color-primary)' }}>
                      <Star size={12} fill="currentColor" /> {t('subscription.popular')}
                    </div>
                  )}
                  <p className="text-sm font-semibold mb-1" style={{ color: isPopular ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)' }}>
                    {t(`subscription.plans.${key}.audience`)}
                  </p>
                  <h3 className="font-heading text-2xl font-extrabold mb-3"
                    style={{ color: isPopular ? 'white' : 'var(--color-text)' }}>
                    {t(`subscription.plans.${key}.name`)}
                  </h3>
                  <div className="flex items-end gap-1 mb-6">
                    <span className="font-heading text-4xl font-extrabold"
                      style={{ color: isPopular ? 'white' : 'var(--color-text)' }}>
                      {t(`subscription.plans.${key}.price`)}
                    </span>
                    <span className="text-sm mb-1" style={{ color: isPopular ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)' }}>
                      {t('subscription.perMonth')}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-3 flex-1 mb-8">
                    {(t.raw(`subscription.plans.${key}.features`) as string[]).map((f: string) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm"
                        style={{ color: isPopular ? 'rgba(255,255,255,0.9)' : 'var(--color-text)' }}>
                        <Check size={15} className="flex-shrink-0 mt-0.5"
                          style={{ color: isPopular ? 'white' : 'var(--color-primary)' }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href="#request"
                    onClick={e => { e.preventDefault(); document.getElementById('request')?.scrollIntoView({ behavior: 'smooth' }) }}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-center transition-all hover:opacity-90"
                    style={isPopular
                      ? { background: 'white', color: 'var(--color-primary)' }
                      : { background: 'var(--gradient-primary)', color: 'white' }}>
                    {t('subscription.cta')}
                  </a>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
