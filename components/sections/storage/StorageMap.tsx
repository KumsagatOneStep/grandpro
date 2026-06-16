'use client'
import { useEffect, useRef } from 'react'

interface StorageMapProps {
  lat: number
  lon: number
  locationName: string
  address: string
  height?: string
}

const CONTAINER_ID = 'storage-2gis-map'
const SCRIPT_ID = '2gis-api'

export function StorageMap({ lat, lon, locationName, address, height = '260px' }: StorageMapProps) {
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    const popup =
      `<div style="font-family:Arial,sans-serif;padding:4px 2px">` +
      `<b style="font-size:13px;color:#0284C7">${locationName}</b><br>` +
      `<span style="font-size:12px;color:#475569">${address}</span>` +
      `</div>`

    const init = () => {
      const DG = (window as any).DG
      if (!DG) return
      DG.then(() => {
        const dg = (window as any).DG
        if (!dg) return
        const container = document.getElementById(CONTAINER_ID)
        if (!container) return

        if (mapRef.current) {
          mapRef.current.setView([lat, lon], 16)
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lon])
            markerRef.current.setPopupContent(popup).openPopup()
          }
          return
        }

        const map = dg.map(CONTAINER_ID, { center: [lat, lon], zoom: 16, fullscreenControl: false })
        mapRef.current = map
        markerRef.current = dg.marker([lat, lon])
          .addTo(map)
          .bindPopup(popup)
          .openPopup()
      })
    }

    if ((window as any).DG) {
      init()
    } else if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = 'https://maps.api.2gis.ru/2.0/loader.js?pkg=full'
      let cancelled = false
      script.onload = () => { if (!cancelled) init() }
      document.head.appendChild(script)
      return () => {
        cancelled = true
        if (mapRef.current) {
          try { mapRef.current.remove() } catch {}
          mapRef.current = null
          markerRef.current = null
        }
      }
    } else {
      let attempts = 0
      const poll = setInterval(() => {
        attempts++
        if ((window as any).DG) { clearInterval(poll); init(); return }
        if (attempts >= 40) clearInterval(poll)
      }, 150)
      return () => clearInterval(poll)
    }

    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove() } catch {}
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [lat, lon, locationName, address])

  return (
    <div
      id={CONTAINER_ID}
      style={{
        width: '100%',
        height,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
      }}
    />
  )
}
