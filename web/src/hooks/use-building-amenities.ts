import { useEffect, useRef, useState } from "react"

import { loadAmenitiesForBuilding, type Amenity, type Building } from "@/data/amenities"

type AmenitiesState = {
  amenities: Amenity[]
  buildingId: number | null
  error: string
  status: "idle" | "loading" | "ready" | "error"
}

const initialState: AmenitiesState = {
  amenities: [],
  buildingId: null,
  error: "",
  status: "idle",
}

export function useBuildingAmenities(building: Building | null) {
  const cache = useRef(new Map<number, Amenity[]>())
  const latestRequestByBuilding = useRef(new Map<number, number>())
  const nextRequest = useRef(0)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [state, setState] = useState<AmenitiesState>(initialState)

  useEffect(() => {
    if (!building) {
      setState(initialState)
      return
    }

    const cachedAmenities = cache.current.get(building.id)
    if (cachedAmenities !== undefined) {
      setState({
        amenities: cachedAmenities,
        buildingId: building.id,
        error: "",
        status: "ready",
      })
      return
    }

    let cancelled = false
    const request = ++nextRequest.current
    latestRequestByBuilding.current.set(building.id, request)
    setState({ amenities: [], buildingId: building.id, error: "", status: "loading" })

    loadAmenitiesForBuilding(building)
      .then((amenities) => {
        if (latestRequestByBuilding.current.get(building.id) !== request) return
        cache.current.set(building.id, amenities)
        if (!cancelled) {
          setState({ amenities, buildingId: building.id, error: "", status: "ready" })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            amenities: [],
            buildingId: building.id,
            error: error instanceof Error ? error.message : "Unable to load amenities.",
            status: "error",
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [building, loadAttempt])

  const isCurrentBuilding = building?.id === state.buildingId
  const status: AmenitiesState["status"] = building === null
    ? "idle"
    : isCurrentBuilding ? state.status : "loading"

  return {
    amenities: isCurrentBuilding ? state.amenities : [],
    error: isCurrentBuilding ? state.error : "",
    status,
    retry: () => setLoadAttempt((attempt) => attempt + 1),
  }
}
