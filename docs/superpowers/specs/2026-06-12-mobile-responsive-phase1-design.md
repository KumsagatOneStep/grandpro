# Mobile Responsive Design — Phase 1

## Scope
Make Hero section, BookingForm, and ServicesSection fully responsive for phones and tablets (320–1024px). Desktop (≥1024px) remains unchanged.

## Target breakpoints
| Name | Range | Tailwind prefix |
|------|-------|-----------------|
| Mobile | 320–639px | (no prefix / base) |
| Tablet | 640–1023px | `sm:` |
| Desktop | ≥1024px | `lg:` |

---

## 1. HeroSection (`components/sections/HeroSection.tsx`)

### Typography scale
| Element | Mobile | Tablet (sm) | Desktop (lg+) |
|---------|--------|-------------|---------------|
| `<h1>` | `text-2xl` (24px) | `text-3xl` (30px) | `text-5xl` / `text-[3.75rem]` |
| Subtitle `<p>` | `text-sm` | `text-base` | `text-lg` |
| Stat numbers | `text-2xl` | `text-3xl` | unchanged |
| Stat labels | `text-xs` | `text-sm` | unchanged |

Remove `max-w-xl` from subtitle on mobile — let it fill the container.

### Spacing
- Section top padding: `pt-20 sm:pt-24 lg:pt-32` (was `pt-32` everywhere)
- Section bottom padding: `pb-10 sm:pb-12 lg:pb-16` (was `pb-16` everywhere)

### CTA buttons
Change from `flex-wrap gap-3` to `flex-col sm:flex-row gap-3`:
- Mobile: each button `w-full`, stacked vertically
- Tablet+: buttons side by side, `w-auto`

### Trust badges
Container already has `flex-wrap gap-2`. Add `overflow-hidden` to prevent any bleed on narrow screens. No other changes.

### Stats grid
Already `grid-cols-2 sm:grid-cols-4`. Only font size changes (see table above).

---

## 2. BookingForm (`components/forms/BookingForm.tsx`)

### Card container
- Padding: `p-4 sm:p-5` (was `p-5` everywhere)
- Title: `text-base sm:text-lg font-bold` (was `text-lg`)

### Address row (primary fix)
Change layout from `flex-row` to `flex-col sm:flex-row`:

**Mobile layout:**
```
┌─────────────────────────┐
│ 📍 Адрес погрузки...    │
└─────────────────────────┘
        [ ⇌ ]              ← swap button centered horizontally
┌─────────────────────────┐
│ 📍 Адрес выгрузки...    │
└─────────────────────────┘
```

**Tablet+ layout (unchanged):**
```
┌──────────────┐ [⇌] ┌──────────────┐
│ 📍 Откуда... │     │ 📍 Куда...   │
└──────────────┘     └──────────────┘
```

Implementation:
- Outer div: `flex flex-col sm:flex-row gap-2 min-w-0`
- Swap button: on mobile `self-center` (centered horizontally), on sm+ `self-stretch flex-shrink-0`
- Each address button: `w-full` on mobile, `flex-1 min-w-0` on sm+

### Other form rows
- No layout changes — vehicle selector, workers counter, options grid, datetime, phone, submit button are already correct at all breakpoints.

---

## 3. ServicesSection (`components/sections/ServicesSection.tsx`)

### Card padding
- `p-5 sm:p-8` (was `p-8` everywhere)

### Section heading & description
Apply same typography scale as Hero:
- Section title: `text-2xl sm:text-3xl lg:text-4xl`
- Section subtitle: `text-sm sm:text-base`

### Grid
Already `grid sm:grid-cols-2 lg:grid-cols-3` — no changes needed.

---

## Out of scope (Phase 2)
- CalculatorSection
- ReviewsSection
- GallerySection
- FaqSection
- ContactSection
- AboutSection
- BrandsSection
- Navbar / MobileDrawer layout changes

## Non-goals
- No changes to desktop layout (≥1024px)
- No new components created
- No changes to color, typography weight, or brand identity
- No changes to AddressDrawer (already full-screen on mobile)
