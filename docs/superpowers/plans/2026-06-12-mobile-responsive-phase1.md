# Mobile Responsive Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make HeroSection, BookingForm, and ServicesSection fully responsive for phones and tablets (320–1024px) while leaving desktop (≥1024px) unchanged.

**Architecture:** Three focused edits to existing components — responsive typography/spacing in HeroSection, address row stacking in BookingForm, and compact card padding in ServicesSection. The shared SectionHeader component is updated once so all section headings get correct mobile typography.

**Tech Stack:** Next.js 16.2.7 App Router, React 19, TypeScript 5, Tailwind CSS 4. Breakpoints: base (mobile ≤639px), `sm:` (640px+), `lg:` (1024px+).

---

## Files Touched

| File | Change |
|------|--------|
| `components/sections/HeroSection.tsx` | Responsive h1, subtitle, section padding, CTA button layout, stat numbers |
| `components/forms/BookingForm.tsx` | Address row flex-col→flex-row, compact card padding and title size |
| `components/ui/SectionHeader.tsx` | Responsive h2 text scale, subtitle text scale, wrapper margin |
| `components/sections/ServicesSection.tsx` | Card padding `p-5 sm:p-8` |

---

### Task 1: HeroSection responsive typography and layout

**Files:**
- Modify: `components/sections/HeroSection.tsx`

- [ ] **Step 1: Apply all changes to HeroSection.tsx**

Open `components/sections/HeroSection.tsx` and make the following edits:

**a. Section padding (line 11) — reduce top/bottom padding on mobile:**
```tsx
// Before
className="min-h-screen flex items-center relative pt-32 pb-16 overflow-hidden"
// After
className="min-h-screen flex items-center relative pt-20 sm:pt-24 lg:pt-32 pb-10 sm:pb-12 lg:pb-16 overflow-hidden"
```

**b. h1 text scale (line 78) — smaller on mobile, same on desktop:**
```tsx
// Before
className="font-heading text-4xl md:text-5xl lg:text-[3.75rem] font-extrabold leading-[1.1] tracking-tight mb-6"
// After
className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.75rem] font-extrabold leading-[1.1] tracking-tight mb-6"
```

**c. Subtitle paragraph (line 95) — smaller text + remove max-w on mobile:**
```tsx
// Before
className="text-lg leading-relaxed mb-9 max-w-xl"
// After
className="text-sm sm:text-base lg:text-lg leading-relaxed mb-9 sm:max-w-xl"
```

**d. CTA buttons container (line 101) — stack vertically on mobile:**
```tsx
// Before
<div className="flex flex-wrap gap-3">
// After
<div className="flex flex-col sm:flex-row gap-3">
```

**e. Primary CTA button (line 102) — full width on mobile:**
```tsx
// Before
className="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-white
  transition-all duration-200 hover:-translate-y-1 cursor-pointer"
// After
className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white
  w-full sm:w-auto transition-all duration-200 hover:-translate-y-1 cursor-pointer"
```

**f. Secondary CTA button (line 117) — full width on mobile:**
```tsx
// Before
className="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-bold
  transition-all duration-200 hover:-translate-y-1 cursor-pointer"
// After
className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold
  w-full sm:w-auto transition-all duration-200 hover:-translate-y-1 cursor-pointer"
```

**g. Stats grid number size (line 144) — smaller on mobile:**
```tsx
// Before
className="font-heading text-3xl font-extrabold tracking-tight"
// After
className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight"
```

- [ ] **Step 2: Build check**

Run: `npx tsc --noEmit`
Expected: no new TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add components/sections/HeroSection.tsx
git commit -m "feat(mobile): HeroSection responsive typography, padding, and CTA layout"
```

---

### Task 2: BookingForm address row stacking and compact card

**Files:**
- Modify: `components/forms/BookingForm.tsx`

Current state of the address row (lines 156–211):
- Container: `flex gap-2 min-w-0` — always horizontal
- "From" button: `style={{ ...rowStyle, flex: 1, width: 'auto', minWidth: 0 }}` — overrides `rowStyle.width: '100%'` to `auto`
- Swap icon button: `className="w-9 flex items-center justify-center rounded-xl cursor-pointer flex-shrink-0 transition-colors"`
- "To" button: same inline style as "From"

Target on mobile (≤639px):
```
┌─────────────────────────┐
│ 📍 Адрес погрузки...    │  ← full width
└─────────────────────────┘
        [ ⇌ ]               ← centered horizontally
┌─────────────────────────┐
│ 📍 Адрес выгрузки...    │  ← full width
└─────────────────────────┘
```

Target on tablet+ (640px+): unchanged horizontal layout.

- [ ] **Step 1: Apply all changes to BookingForm.tsx**

**a. Card container padding (line 140):**
```tsx
// Before
className="relative p-5 rounded-2xl"
// After
className="relative p-4 sm:p-5 rounded-2xl"
```

**b. Card title size (line 149):**
```tsx
// Before
<h3 className="font-heading text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>
// After
<h3 className="font-heading text-base sm:text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>
```

**c. Address row container (line 156) — add flex-col for mobile:**
```tsx
// Before
<div className="flex gap-2 min-w-0">
// After
<div className="flex flex-col sm:flex-row gap-2 min-w-0">
```

**d. "From" button — replace width override with responsive classes (line 157):**

Remove `flex: 1` and `width: 'auto'` from inline style. Add `className` for responsive width.
```tsx
// Before
<button
  style={{ ...rowStyle, flex: 1, width: 'auto', minWidth: 0 }}
  onClick={() => setActiveDrawer('address')}
  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
>
// After
<button
  style={{ ...rowStyle, minWidth: 0 }}
  className="w-full sm:flex-1 sm:w-auto"
  onClick={() => setActiveDrawer('address')}
  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
>
```

**e. Swap icon button — center it between the stacked fields on mobile (line 177):**
```tsx
// Before
className="w-9 flex items-center justify-center rounded-xl cursor-pointer flex-shrink-0 transition-colors"
// After
className="w-9 flex items-center justify-center rounded-xl cursor-pointer flex-shrink-0 self-center sm:self-stretch transition-colors"
```

**f. "To" button — same change as "From" (line 192):**
```tsx
// Before
<button
  style={{ ...rowStyle, flex: 1, width: 'auto', minWidth: 0 }}
  onClick={() => setActiveDrawer('address')}
  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
>
// After
<button
  style={{ ...rowStyle, minWidth: 0 }}
  className="w-full sm:flex-1 sm:w-auto"
  onClick={() => setActiveDrawer('address')}
  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
>
```

- [ ] **Step 2: Build check**

Run: `npx tsc --noEmit`
Expected: no new TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add components/forms/BookingForm.tsx
git commit -m "feat(mobile): BookingForm address row stacks vertically on mobile, compact card"
```

---

### Task 3: ServicesSection card padding + SectionHeader typography

**Files:**
- Modify: `components/ui/SectionHeader.tsx`
- Modify: `components/sections/ServicesSection.tsx`

Note: SectionHeader is used by multiple sections (Services, Calculator, Reviews, etc.). The typography fix is the same for all — updating it here covers all sections, not just ServicesSection. This is intentional.

- [ ] **Step 1: Update SectionHeader.tsx**

**a. Wrapper bottom margin (line 14) — less gap on mobile:**
```tsx
// Before
className={`mb-16 ${align === 'center' ? 'text-center' : ''} ${className ?? ''}`}
// After
className={`mb-10 sm:mb-16 ${align === 'center' ? 'text-center' : ''} ${className ?? ''}`}
```

**b. h2 text scale (line 21) — smaller on mobile:**
```tsx
// Before
className="font-heading text-3xl md:text-4xl lg:text-[2.6rem] font-bold tracking-tight mb-4 inline-block relative"
// After
className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4 inline-block relative"
```

**c. Subtitle text scale (line 40) — smaller on mobile:**
```tsx
// Before
className={`text-lg leading-relaxed mt-7 ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`}
// After
className={`text-sm sm:text-base lg:text-lg leading-relaxed mt-7 ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`}
```

- [ ] **Step 2: Update ServicesSection.tsx card padding (line 43)**

```tsx
// Before
className="group relative flex flex-col overflow-hidden rounded-2xl p-8
  transition-all duration-300 hover:-translate-y-2 cursor-pointer"
// After
className="group relative flex flex-col overflow-hidden rounded-2xl p-5 sm:p-8
  transition-all duration-300 hover:-translate-y-2 cursor-pointer"
```

- [ ] **Step 3: Build check**

Run: `npx tsc --noEmit`
Expected: no new TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add components/ui/SectionHeader.tsx components/sections/ServicesSection.tsx
git commit -m "feat(mobile): ServicesSection card padding and SectionHeader responsive typography"
```

---

## Visual Verification Checklist

After all three tasks, open the dev server and verify at 375px, 640px, and 1280px:

| Element | 375px | 640px | 1280px |
|---------|-------|-------|--------|
| Hero h1 | 24px (text-2xl) | 30px (text-3xl) | unchanged |
| Hero subtitle | 14px (text-sm) | 16px (text-base) | unchanged |
| Hero CTA buttons | stacked, full-width | side by side | unchanged |
| Hero stat numbers | 24px (text-2xl) | 30px (text-3xl) | unchanged |
| BookingForm padding | 16px (p-4) | 20px (p-5) | unchanged |
| Address "From" | full-width button | flex-1 | unchanged |
| Address swap btn | centered between stacked | between side-by-side | unchanged |
| SectionHeader h2 | 24px (text-2xl) | 30px (text-3xl) | unchanged |
| SectionHeader subtitle | 14px (text-sm) | 16px (text-base) | unchanged |
| Service card padding | 20px (p-5) | 32px (p-8) | unchanged |
