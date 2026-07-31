import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { loadBuildings } from "@/data/amenities"
import { useBuildings } from "@/hooks/use-buildings"
import { buildings } from "@/test/amenity-fixtures"

vi.mock("@/data/amenities", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/data/amenities")>(),
  loadBuildings: vi.fn(),
}))

describe("useBuildings", () => {
  beforeEach(() => {
    vi.mocked(loadBuildings).mockReset()
  })

  it("reports a load error and retries", async () => {
    vi.mocked(loadBuildings)
      .mockRejectedValueOnce(new Error("Database unavailable"))
      .mockResolvedValueOnce(buildings)

    const { result } = renderHook(() => useBuildings())

    await waitFor(() => expect(result.current.status).toBe("error"))
    expect(result.current.error).toBe("Database unavailable")

    act(() => result.current.retry())

    expect(result.current.status).toBe("loading")
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current.buildings).toBe(buildings)
    expect(loadBuildings).toHaveBeenCalledTimes(2)
  })
})
