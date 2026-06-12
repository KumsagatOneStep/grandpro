'use client'
import { useEffect, useRef } from 'react'

const SCRIPT_ID = '2gis-api'

export interface MapPoint {
  lat: number
  lon: number
}

interface BookingMapProps {
  fromPoint?: MapPoint
  toPoint?: MapPoint
  containerId?: string
}

export function BookingMap({ fromPoint, toPoint, containerId = 'booking-route-map' }: BookingMapProps) {
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylineRef = useRef<any>(null)

  const getMap = () => mapRef.current

  const clearOverlays = () => {
    markersRef.current.forEach(m => { try { m.remove() } catch {} })
    markersRef.current = []
    if (polylineRef.current) {
      try { polylineRef.current.remove() } catch {}
      polylineRef.current = null
    }
  }

  const drawOverlays = () => {
    const map = getMap()
    if (!map) return
    const DG = (window as any).DG
    if (!DG) return

    clearOverlays()

    const points: [number, number][] = []

    if (fromPoint) {
      const m = DG.marker([fromPoint.lat, fromPoint.lon]).addTo(map)
      markersRef.current.push(m)
      points.push([fromPoint.lat, fromPoint.lon])
    }
    if (toPoint) {
      const m = DG.marker([toPoint.lat, toPoint.lon]).addTo(map)
      markersRef.current.push(m)
      points.push([toPoint.lat, toPoint.lon])
    }
    if (points.length === 2) {
      polylineRef.current = DG.polyline(points, {
        color: '#0ea5e9',
        weight: 3,
        opacity: 0.8,
      }).addTo(map)
      map.fitBounds(DG.latLngBounds(points), { padding: [40, 40] })
    } else if (points.length === 1) {
      map.setView(points[0], 15)
    }
  }

  useEffect(() => {
    if (mapRef.current) return

    const init = () => {
      const DG = (window as any).DG
      if (!DG) return
      DG.then(function () {
        const dg = (window as any).DG
        if (!dg || mapRef.current) return
        const container = document.getElementById(containerId)
        if (!container) return
        mapRef.current = dg.map(containerId, {
          center: [43.2220, 76.8512],
          zoom: 12,
          fullscreenControl: false,
          zoomControl: true,
        })
        drawOverlays()
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
      clearOverlays()
      if (mapRef.current) {
        try { (mapRef.current as any).remove() } catch {}
        mapRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-draw overlays whenever points change
  useEffect(() => {
    drawOverlays()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromPoint?.lat, fromPoint?.lon, toPoint?.lat, toPoint?.lon])

  return (
    <div
      id={containerId}
      style={{ width: '100%', height: '100%', minHeight: '300px' }}
    />
  )
}
