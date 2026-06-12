'use client'
import { useState, useEffect, useRef } from 'react'

export interface Suggestion {
  name: string
  fullName: string
  type: string
  lat: number | null
  lon: number | null
}

interface SuggestItem {
  name?: string
  full_name?: string
  type?: string
  point?: { lat: number; lon: number }
}

interface SuggestResponse {
  result?: { items?: SuggestItem[] }
}

const SUGGEST_URL = 'https://catalog.api.2gis.com/3.0/suggests'

export function useAddressSuggest(query: string): {
  suggestions: Suggestion[]
  loading: boolean
} {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < 2) {
      abortRef.current?.abort()          // abort any in-flight request
      if (timerRef.current) clearTimeout(timerRef.current)
      setSuggestions([])
      setLoading(false)
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const key = process.env.NEXT_PUBLIC_2GIS_KEY
      if (!key) {
        setSuggestions([])
        setLoading(false)
        return
      }

      setLoading(true)                   // moved here — only set after debounce fires

      const params = new URLSearchParams({
        q: trimmed,
        key,
        locale: 'ru_RU',
        fields: 'items.point,items.full_name',
        limit: '5',
      })

      try {
        const res = await fetch(`${SUGGEST_URL}?${params}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: SuggestResponse = await res.json()
        const items = data?.result?.items ?? []
        setSuggestions(
          items.map(item => ({
            name: item.name ?? '',
            fullName: item.full_name ?? item.name ?? '',
            type: item.type ?? 'street_address',
            lat: item.point?.lat ?? null,
            lon: item.point?.lon ?? null,
          }))
        )
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  // Abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { suggestions, loading }
}
