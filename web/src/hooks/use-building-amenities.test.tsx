import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { loadAmenitiesForBuilding, type Amenity, type Building } from "@/data/amenities"
import { useBuildingAmenities } from "@/hooks/use-building-amenities"
import { amenities, buildings } from "@/test/amenity-fixtures"

vi.mock("@/data/amenities", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/data/amenities")>(),
  loadAmenitiesForBuilding: vi.fn(),
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

describe("useBuildingAmenities", () => {
  beforeEach(() => {
    vi.mocked(loadAmenitiesForBuilding).mockReset()
  })

  it("caches successful empty results", async () => {
    vi.mocked(loadAmenitiesForBuilding).mockResolvedValue([])
    const building = buildings[0]
    const { rerender, result } = renderHook(
      ({ selectedBuilding }) => useBuildingAmenities(selectedBuilding),
      { initialProps: { selectedBuilding: building as Building | null } },
    )

    await waitFor(() => expect(result.current.status).toBe("ready"))
    rerender({ selectedBuilding: null })
    rerender({ selectedBuilding: building })

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current.amenities).toEqual([])
    expect(loadAmenitiesForBuilding).toHaveBeenCalledTimes(1)
  })

  it("ignores stale results while retaining them in the session cache", async () => {
    const firstRequest = deferred<Amenity[]>()
    const secondRequest = deferred<Amenity[]>()
    const firstBuilding = buildings[0]
    const secondBuilding = buildings[1]
    const firstAmenities = amenities.filter((amenity) => amenity.buildingId === firstBuilding.id)
    const secondAmenities = amenities.filter((amenity) => amenity.buildingId === secondBuilding.id)
    vi.mocked(loadAmenitiesForBuilding)
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise)

    const { rerender, result } = renderHook(
      ({ selectedBuilding }) => useBuildingAmenities(selectedBuilding),
      { initialProps: { selectedBuilding: firstBuilding } },
    )

    rerender({ selectedBuilding: secondBuilding })
    await act(async () => firstRequest.resolve(firstAmenities))

    expect(result.current.status).toBe("loading")
    expect(result.current.amenities).toEqual([])

    await act(async () => secondRequest.resolve(secondAmenities))
    expect(result.current.status).toBe("ready")
    expect(result.current.amenities).toEqual(secondAmenities)

    rerender({ selectedBuilding: firstBuilding })
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current.amenities).toEqual(firstAmenities)
    expect(loadAmenitiesForBuilding).toHaveBeenCalledTimes(2)
  })

  it("does not let an older request overwrite newer cached amenities for the same building", async () => {
    const firstRequest = deferred<Amenity[]>()
    const secondRequest = deferred<Amenity[]>()
    const building = buildings[0]
    const buildingAmenities = amenities.filter((amenity) => amenity.buildingId === building.id)
    const olderAmenities = [...buildingAmenities]
    const newerAmenities = [...buildingAmenities]
    vi.mocked(loadAmenitiesForBuilding)
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise)

    const { rerender, result } = renderHook(
      ({ selectedBuilding }) => useBuildingAmenities(selectedBuilding),
      { initialProps: { selectedBuilding: building as Building | null } },
    )

    rerender({ selectedBuilding: null })
    rerender({ selectedBuilding: building })
    await act(async () => secondRequest.resolve(newerAmenities))
    expect(result.current.amenities).toBe(newerAmenities)

    await act(async () => firstRequest.resolve(olderAmenities))
    rerender({ selectedBuilding: null })
    rerender({ selectedBuilding: building })

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current.amenities).toBe(newerAmenities)
    expect(loadAmenitiesForBuilding).toHaveBeenCalledTimes(2)
  })

  it("retries a failed request", async () => {
    const building = buildings[0]
    const buildingAmenities = amenities.filter((amenity) => amenity.buildingId === building.id)
    vi.mocked(loadAmenitiesForBuilding)
      .mockRejectedValueOnce(new Error("Amenities unavailable"))
      .mockResolvedValueOnce(buildingAmenities)

    const { result } = renderHook(() => useBuildingAmenities(building))

    await waitFor(() => expect(result.current.status).toBe("error"))
    expect(result.current.error).toBe("Amenities unavailable")

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe("ready"))

    expect(result.current.amenities).toEqual(buildingAmenities)
    expect(loadAmenitiesForBuilding).toHaveBeenCalledTimes(2)
  })
})
