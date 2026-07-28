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
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY && import.meta.env.VITE_GOOGLE_MAPS_MAP_ID
      ? null
      : "Google Maps is not configured.",
  )

  onBuildingSelectRef.current = onBuildingSelect

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID
    let cancelled = false
    let markers: google.maps.marker.AdvancedMarkerElement[] = []
    let listenerCleanups: (() => void)[] = []

    if (!apiKey || !mapId || buildings.length === 0) return

    const handleAuthFailure = () => {
      if (!cancelled) setError("Google Maps could not be authorized.")
    }

    window.gm_authFailure = handleAuthFailure

    loadGoogleMaps(apiKey)
      .then(async () => {
        if (cancelled || !mapRef.current) return

        const { AdvancedMarkerElement, CollisionBehavior } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary
        if (cancelled || !mapRef.current) return

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 37.8719, lng: -122.2585 },
          zoom: 16,
          mapId,
          mapTypeId: "roadmap",
          disableDefaultUI: true,
          clickableIcons: false,
        })

        markers = buildings.map((building) => {
          const position = {
            lat: building.coordinates.latitude,
            lng: building.coordinates.longitude,
          }
          const label = document.createElement("span")
          label.className = "campus-building-label"
          label.textContent = building.shortName ?? building.name

          const marker = new AdvancedMarkerElement({
            anchorLeft: "-50%",
            anchorTop: "-50%",
            collisionBehavior: CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY,
            content: label,
            gmpClickable: true,
            map,
            position,
            title: building.name,
            zIndex: building.amenityCounts.total * 10_000 - building.id,
          })
          const handleClick = () => {
            map.panTo(position)
            onBuildingSelectRef.current(building)
          }

          marker.addEventListener("gmp-click", handleClick)
          listenerCleanups.push(() => marker.removeEventListener("gmp-click", handleClick))

          return marker
        })
      })
      .catch(() => {
        if (!cancelled) setError("Google Maps failed to load.")
      })

    return () => {
      cancelled = true
      listenerCleanups.forEach((cleanup) => cleanup())
      markers.forEach((marker) => {
        marker.map = null
      })
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
