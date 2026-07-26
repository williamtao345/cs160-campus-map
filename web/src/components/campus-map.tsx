import { useEffect, useRef, useState } from "react"

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

export function CampusMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? null : "Google Maps is not configured.",
  )

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    let cancelled = false

    if (!apiKey) return

    const handleAuthFailure = () => {
      if (!cancelled) setError("Google Maps could not be authorized.")
    }

    window.gm_authFailure = handleAuthFailure

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current) return

        new google.maps.Map(mapRef.current, {
          center: { lat: 37.8719, lng: -122.2585 },
          zoom: 16,
          mapTypeId: "roadmap",
          disableDefaultUI: true,
          clickableIcons: false,
        })
      })
      .catch(() => {
        if (!cancelled) setError("Google Maps failed to load.")
      })

    return () => {
      cancelled = true
      if (window.gm_authFailure === handleAuthFailure) window.gm_authFailure = undefined
    }
  }, [])

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
