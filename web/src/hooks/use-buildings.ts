import { useEffect, useState } from "react"

import { loadBuildings, type Building } from "@/data/amenities"

type BuildingsState = {
  buildings: Building[]
  error: string
  status: "loading" | "ready" | "error"
}

export function useBuildings() {
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [state, setState] = useState<BuildingsState>({
    buildings: [],
    error: "",
    status: "loading",
  })

  useEffect(() => {
    let cancelled = false
    setState((current) => ({ ...current, error: "", status: "loading" }))

    loadBuildings()
      .then((buildings) => {
        if (!cancelled) setState({ buildings, error: "", status: "ready" })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            buildings: [],
            error: error instanceof Error ? error.message : "Unable to load campus data.",
            status: "error",
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [loadAttempt])

  return {
    ...state,
    retry: () => setLoadAttempt((attempt) => attempt + 1),
  }
}
