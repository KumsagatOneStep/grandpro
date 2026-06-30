'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { formatPrice } from '@/lib/utils'
import { VEHICLES } from '@/components/forms/booking/types'

/* Extra dimensions not in the booking type (cargo area only) */
const DIMS: Record<string, { w: number; h: number }> = {
  'gazel-15':  { w: 1.80, h: 1.80 },
  'gazel-4m':  { w: 1.80, h: 1.90 },
  'furgon-3t': { w: 2.10, h: 2.20 },
  'euro-5t':   { w: 2.20, h: 2.40 },
}

const SCALE = 28   /* px per metre */
const GROUND_Y = 152
const WHEEL_R  = 17
const AXLE_Y   = GROUND_Y - WHEEL_R
const CAB_W    = 54
const VB_W     = 290
const VB_H     = 200

function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}   fill="#1E293B" />
      <circle cx={cx} cy={cy} r={r * .65} fill="#374151" />
      <line x1={cx} y1={cy - r * .55} x2={cx} y2={cy + r * .55} stroke="#A855F7" strokeWidth="2" />
      <line x1={cx - r * .55} y1={cy} x2={cx + r * .55} y2={cy} stroke="#A855F7" strokeWidth="2" />
      <line x1={cx - r * .38} y1={cy - r * .38} x2={cx + r * .38} y2={cy + r * .38} stroke="#A855F7" strokeWidth="1.5" opacity=".7" />
      <line x1={cx + r * .38} y1={cy - r * .38} x2={cx - r * .38} y2={cy + r * .38} stroke="#A855F7" strokeWidth="1.5" opacity=".7" />
      <circle cx={cx} cy={cy} r={r * .22} fill="#A855F7" />
    </g>
  )
}

function DimArrow({
  x1, y1, x2, y2, label, vertical = false
}: {
  x1: number; y1: number; x2: number; y2: number
  label: string; vertical?: boolean
}) {
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  const arrowSize = 5
  const color = '#64748B'

  return (
    <g>
      {/* line */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1" strokeDasharray="2 2" />
      {/* arrowheads */}
      {vertical ? (
        <>
          <polygon points={`${x1},${y1} ${x1 - arrowSize / 2},${y1 + arrowSize} ${x1 + arrowSize / 2},${y1 + arrowSize}`} fill={color} />
          <polygon points={`${x2},${y2} ${x2 - arrowSize / 2},${y2 - arrowSize} ${x2 + arrowSize / 2},${y2 - arrowSize}`} fill={color} />
          <text x={x1 + 7} y={midY + 4} fontSize="9" fill={color} fontFamily="Arial, sans-serif" fontWeight="600">{label}</text>
        </>
      ) : (
        <>
          <polygon points={`${x1},${y1} ${x1 + arrowSize},${y1 - arrowSize / 2} ${x1 + arrowSize},${y1 + arrowSize / 2}`} fill={color} />
          <polygon points={`${x2},${y2} ${x2 - arrowSize},${y2 - arrowSize / 2} ${x2 - arrowSize},${y2 + arrowSize / 2}`} fill={color} />
          <text x={midX} y={y1 + 13} fontSize="9" fill={color} fontFamily="Arial, sans-serif" fontWeight="600" textAnchor="middle">{label}</text>
        </>
      )}
    </g>
  )
}

function VehicleSVG({ vehicleId, lengthM, heightM }: {
  vehicleId: string
  lengthM: number
  heightM: number
}) {
  const cargoW  = lengthM * SCALE
  const cargoH  = heightM * SCALE
  const cargoX  = Math.max(8, (VB_W - cargoW - CAB_W) / 2)
  const cargoY  = AXLE_Y - cargoH
  const cabX    = cargoX + cargoW
  const cabTopY = cargoY - 8   /* cab slightly taller than cargo */

  /* wheel positions */
  const wr1X = cargoX + 18
  const wr2X = cargoX + WHEEL_R * 2 + 22
  const wfX  = cabX + 14

  /* whether to show second rear wheel (only if cargo long enough) */
  const showDoubleRear = cargoW > 90

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">

      {/* ground shadow */}
      <ellipse cx={VB_W / 2} cy={GROUND_Y + 6} rx={cargoW / 2 + CAB_W / 2 + 20} ry={6} fill="rgba(0,0,0,0.07)" />

      {/* ── Cargo body ── */}
      <rect x={cargoX} y={cargoY} width={cargoW} height={cargoH} rx="4" fill="white" stroke="#7C3AED" strokeWidth="2" />

      {/* top stripe */}
      <rect x={cargoX} y={cargoY} width={cargoW} height={13} rx="4" fill="#7C3AED" />
      <rect x={cargoX} y={cargoY + 6} width={cargoW} height={7} fill="#7C3AED" />

      {/* bottom stripe */}
      <rect x={cargoX} y={cargoY + cargoH - 11} width={cargoW} height={11} fill="#7C3AED" />

      {/* door seam */}
      {cargoW > 70 && (
        <line
          x1={cargoX + cargoW * .7} y1={cargoY + 13}
          x2={cargoX + cargoW * .7} y2={cargoY + cargoH - 11}
          stroke="#7C3AED" strokeWidth="1" strokeDasharray="3 3" opacity=".2"
        />
      )}

      {/* logo text on cargo side */}
      <text
        x={cargoX + cargoW * .45}
        y={cargoY + cargoH * .52 + 4}
        textAnchor="middle"
        fill="#7C3AED"
        fontSize={Math.max(7, Math.min(11, cargoW / 9))}
        fontWeight="800"
        fontFamily="Arial Black, Arial, sans-serif"
      >GrandPro</text>
      {cargoH > 44 && (
        <text
          x={cargoX + cargoW * .45}
          y={cargoY + cargoH * .52 + 15}
          textAnchor="middle"
          fill="#65A30D"
          fontSize={Math.max(5, Math.min(7.5, cargoW / 12))}
          fontWeight="700"
          fontFamily="Arial, sans-serif"
          letterSpacing="1"
        >MOVING ALMATY</text>
      )}

      {/* ── Cab ── */}
      <path
        d={`M ${cabX} ${cargoY + 8} L ${cabX} ${AXLE_Y} L ${cabX + CAB_W} ${AXLE_Y} L ${cabX + CAB_W} ${cargoY + 40} L ${cabX + CAB_W - 16} ${cabTopY} Z`}
        fill="#7C3AED"
      />
      {/* cab window */}
      <path
        d={`M ${cabX + 6} ${cabTopY + 7} L ${cabX + 6} ${cargoY + 36} L ${cabX + CAB_W - 4} ${cargoY + 36} L ${cabX + CAB_W - 4} ${cargoY + 32} L ${cabX + CAB_W - 18} ${cabTopY + 7} Z`}
        fill="#EDE9FE" stroke="#6D28D9" strokeWidth="1.5"
      />
      {/* headlight */}
      <rect x={cabX + CAB_W - 8} y={cargoY + 40} width={10} height={12} rx="3" fill="#FEF9C3" stroke="#EAB308" strokeWidth="1" />
      {/* bumper */}
      <rect x={cabX + CAB_W - 5} y={AXLE_Y - 5} width={12} height={12} rx="3" fill="#6D28D9" />
      {/* door handle */}
      <rect x={cabX + 11} y={AXLE_Y - 16} width={12} height={4} rx="2" fill="#C084FC" />

      {/* chassis rail */}
      <rect x={cargoX} y={AXLE_Y} width={cargoW + CAB_W + 4} height={7} rx="2.5" fill="#6D28D9" />

      {/* ── Wheels ── */}
      {showDoubleRear && <Wheel cx={wr1X} cy={AXLE_Y} r={WHEEL_R} />}
      <Wheel cx={showDoubleRear ? wr2X : wr1X + 10} cy={AXLE_Y} r={WHEEL_R} />
      <Wheel cx={wfX} cy={AXLE_Y} r={WHEEL_R} />

      {/* ── Dimension annotations ── */}

      {/* Length arrow (horizontal, below truck) */}
      <DimArrow
        x1={cargoX}            y1={GROUND_Y + 18}
        x2={cabX + CAB_W}      y2={GROUND_Y + 18}
        label={`${lengthM} м`}
      />
      {/* Height arrow (vertical, left of cargo) */}
      <DimArrow
        x1={cargoX - 14} y1={cargoY}
        x2={cargoX - 14} y2={AXLE_Y}
        label={`${heightM} м`}
        vertical
      />

      {/* tick lines */}
      <line x1={cargoX} y1={GROUND_Y + 14} x2={cargoX} y2={GROUND_Y + 22} stroke="#64748B" strokeWidth="1" />
      <line x1={cabX + CAB_W} y1={GROUND_Y + 14} x2={cabX + CAB_W} y2={GROUND_Y + 22} stroke="#64748B" strokeWidth="1" />
      <line x1={cargoX - 18} y1={cargoY} x2={cargoX - 10} y2={cargoY} stroke="#64748B" strokeWidth="1" />
      <line x1={cargoX - 18} y1={AXLE_Y} x2={cargoX - 10} y2={AXLE_Y} stroke="#64748B" strokeWidth="1" />
    </svg>
  )
}

export function FleetSection() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <section id="fleet" className="py-16 md:py-28" style={{ background: 'var(--bg-main)' }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <SectionHeader
          title="Наш автопарк"
          subtitle="Выберите подходящий транспорт под ваш объём груза"
        />

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {VEHICLES.map((v, i) => {
            const dims = DIMS[v.id] ?? { w: 2, h: 2 }
            const isSelected = selected === v.id

            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className="rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: 'var(--bg-surface)',
                    border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    boxShadow: isSelected ? '0 12px 40px var(--shadow-main)' : 'none',
                  }}
                  onClick={() => setSelected(isSelected ? null : v.id)}
                >
                  {/* Price badge */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-1">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--active-badge)', color: 'var(--color-primary)' }}
                    >
                      от {formatPrice(v.basePrice)}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                      {v.volume} м³
                    </span>
                  </div>

                  {/* Truck SVG */}
                  <div className="px-2 py-1">
                    <VehicleSVG
                      vehicleId={v.id}
                      lengthM={v.length}
                      heightM={dims.h}
                    />
                  </div>

                  {/* Info */}
                  <div className="px-4 pb-4 flex-1 flex flex-col">
                    <h3 className="font-heading font-bold text-base mb-3" style={{ color: 'var(--color-text)' }}>
                      {v.label}
                    </h3>

                    {/* Spec grid */}
                    <div
                      className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs mb-4 pt-3"
                      style={{ borderTop: '1px solid var(--color-border)' }}
                    >
                      {[
                        { label: 'Длина', value: `${v.length} м` },
                        { label: 'Ширина', value: `${dims.w} м` },
                        { label: 'Высота', value: `${dims.h} м` },
                        { label: 'Грузоподъёмность', value: `${v.capacity} т` },
                        { label: 'Объём', value: `${v.volume} м³` },
                        { label: 'Базовая цена', value: formatPrice(v.basePrice) },
                      ].map(spec => (
                        <div key={spec.label}>
                          <p style={{ color: 'var(--color-text-muted)' }}>{spec.label}</p>
                          <p className="font-bold" style={{ color: 'var(--color-text)' }}>{spec.value}</p>
                        </div>
                      ))}
                    </div>

                    <a
                      href="#contact"
                      className="mt-auto block w-full py-2.5 rounded-xl text-center text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: isSelected ? 'var(--gradient-primary)' : 'var(--bg-surface-elevated)',
                        color: isSelected ? 'white' : 'var(--color-text)',
                        border: `1px solid ${isSelected ? 'transparent' : 'var(--color-border)'}`,
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      Заказать
                    </a>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
          * Указаны внутренние габариты грузового отсека. Точный подбор транспорта — после звонка менеджера.
        </p>
      </div>
    </section>
  )
}
