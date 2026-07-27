import { useEffect, useRef, useState } from "react"

import type { Building } from "@/data/amenities"

let googleMapsPromise: Promise<void> | undefined

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps) return Promise.resolve()
  if (googleMapsPromise) return googleMapsPromise

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = "initCampusMap"
    const script = document.createElement("script")
    const url = new URL("https://maps.googleapis.com/maps/api/js")

    window[callbackName] = () => {
      window[callbackName] = undefined
      resolve()
    }
    url.searchParams.set("key", apiKey)
    url.searchParams.set("callback", callbackName)
    url.searchParams.set("loading", "async")
    script.src = url.toString()
    script.async = true
    script.onerror = () => {
      window[callbackName] = undefined
      googleMapsPromise = undefined
      reject(new Error("Google Maps failed to load."))
    }
    document.head.append(script)
  })

  return googleMapsPromise
}

export function CampusMap({
  buildings,
  onBuildingSelect,
}: {
  buildings: Building[]
  onBuildingSelect: (building: Building) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const onBuildingSelectRef = useRef(onBuildingSelect)
  const [error, setError] = useState<string | null>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? null : "Google Maps is not configured.",
  )

  onBuildingSelectRef.current = onBuildingSelect

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    let cancelled = false
    let markers: google.maps.Marker[] = []
    let markerListeners: google.maps.MapsEventListener[] = []

    if (!apiKey || buildings.length === 0) return

    const handleAuthFailure = () => {
      if (!cancelled) setError("Google Maps could not be authorized.")
    }

    window.gm_authFailure = handleAuthFailure

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current) return

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 37.8719, lng: -122.2585 },
          zoom: 16,
          mapTypeId: "roadmap",
          disableDefaultUI: true,
          clickableIcons: false,
        })

        markers = buildings.map((building) => {
          const position = {
            lat: building.coordinates.latitude,
            lng: building.coordinates.longitude,
          }
          const marker = new google.maps.Marker({
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 5,
              fillColor: "#003262",
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
            map,
            position,
            title: building.name,
          })

          markerListeners.push(marker.addListener("click", () => {
            map.panTo(position)
            onBuildingSelectRef.current(building)
          }))

          return marker
        })
      })
      .catch(() => {
        if (!cancelled) setError("Google Maps failed to load.")
      })

    return () => {
      cancelled = true
      markerListeners.forEach((listener) => listener.remove())
      markers.forEach((marker) => marker.setMap(null))
      if (window.gm_authFailure === handleAuthFailure) window.gm_authFailure = undefined
    }
  }, [buildings])

  return (
    <section className="campus-map" aria-label="UC Berkeley campus map">
      <div ref={mapRef} className="size-full" />
      {error && (
        <p className="absolute inset-0 z-10 grid place-items-center bg-muted p-4 text-center text-sm text-muted-foreground">
          {error}
        </p>
      )}
    </section>
  )
}
