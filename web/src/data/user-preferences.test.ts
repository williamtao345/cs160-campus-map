import { beforeEach, describe, expect, it, vi } from "vitest"

import { loadUserPreferences, saveUserPreferences } from "@/data/user-preferences"

const { getMock, refMock, setMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  refMock: vi.fn(),
  setMock: vi.fn(),
}))

vi.mock("firebase/database", () => ({
  get: getMock,
  ref: refMock,
  set: setMock,
}))

vi.mock("@/lib/firebase", () => ({
  getFirebaseDatabase: vi.fn(() => ({ database: true })),
}))

describe("user preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    refMock.mockImplementation((_database, path) => ({ path }))
    setMock.mockResolvedValue(undefined)
  })

  it("loads an authenticated user's validated preference", async () => {
    getMock.mockResolvedValue({ val: () => ({ gender: "Non-binary" }) })

    await expect(loadUserPreferences("google-user-1")).resolves.toEqual({ gender: "Non-binary" })
    expect(refMock).toHaveBeenCalledWith({ database: true }, "userPreferences/google-user-1")
  })

  it("returns null when an authenticated user has no preference", async () => {
    getMock.mockResolvedValue({ val: () => null })

    await expect(loadUserPreferences("google-user-1")).resolves.toBeNull()
  })

  it("rejects malformed or unexpected preference data", async () => {
    getMock.mockResolvedValue({ val: () => ({ gender: "invalid", email: "private@example.com" }) })

    await expect(loadUserPreferences("google-user-1")).rejects.toThrow("Invalid user preferences")
  })

  it("writes only validated preferences to the user's path", async () => {
    await saveUserPreferences("google-user-1", { gender: "Woman" })

    expect(setMock).toHaveBeenCalledWith(
      { path: "userPreferences/google-user-1" },
      { gender: "Woman" },
    )
  })
})
