'use client'
import { useEffect, useRef } from 'react'

const CONTAINER_ID = 'booking-route-map'
const SCRIPT_ID = '2gis-api'

export function BookingMap() {
  const mapRef = useRef<unknown>(null)

  useEffect(() => {
    if (mapRef.current) return

    const init = () => {
      const DG = (window as any).DG
      if (!DG) return
      DG.then(function () {
        const dg = (window as any).DG
        if (!dg || mapRef.current) return
        const container = document.getElementById(CONTAINER_ID)
        if (!container) return
        mapRef.current = dg.map(CONTAINER_ID, {
          center: [43.2220, 76.8512],
          zoom: 12,
          fullscreenControl: false,
          zoomControl: true,
        })
      })
    }

    if ((window as any).DG) {
      init()
    } else if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = 'https://maps.api.2gis.ru/2.0/loader.js?pkg=full'
      script.onload = init
      document.head.appendChild(script)
    } else {
      let attempts = 0
      const poll = setInterval(() => {
        attempts++
        if ((window as any).DG) { clearInterval(poll); init() }
        if (attempts >= 40) clearInterval(poll)
      }, 150)
      return () => clearInterval(poll)
    }

    return () => {
      if (mapRef.current) {
        try { (mapRef.current as any).remove() } catch {}
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div
      id={CONTAINER_ID}
      style={{ width: '100%', height: '100%', minHeight: '300px' }}
    />
  )
}
