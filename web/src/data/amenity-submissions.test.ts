import { beforeEach, describe, expect, it, vi } from "vitest"

import { createAmenitySubmission } from "@/data/amenity-submissions"
import type { AuthUser } from "@/lib/auth"

const { pushMock, refMock, serverTimestampMock, setMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refMock: vi.fn(),
  serverTimestampMock: vi.fn(() => ({ ".sv": "timestamp" })),
  setMock: vi.fn(),
}))

vi.mock("firebase/database", () => ({
  push: pushMock,
  ref: refMock,
  serverTimestamp: serverTimestampMock,
  set: setMock,
}))

vi.mock("@/lib/firebase", () => ({
  getFirebaseDatabase: vi.fn(() => ({ database: true })),
}))

const user: AuthUser = {
  uid: "google-user-1",
  displayName: "Test User",
  email: "test@example.com",
  photoURL: null,
}

describe("createAmenitySubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    refMock.mockImplementation((_database, path) => ({ path }))
    pushMock.mockReturnValue({ key: "new-submission" })
    setMock.mockResolvedValue(undefined)
  })

  it("creates a normalized submission under the authenticated user", async () => {
    await createAmenitySubmission({
      user,
      buildingId: 200,
      amenityType: "waterRefillStation",
      floorNumber: 2,
      availability: "available",
      locationDetails: "  Near room 210  ",
      notes: "   ",
    })

    expect(pushMock).toHaveBeenCalledWith({ path: "amenitySubmissions/google-user-1" })
    expect(setMock).toHaveBeenCalledWith({ key: "new-submission" }, {
      userId: "google-user-1",
      buildingId: 200,
      amenityType: "waterRefillStation",
      floorNumber: 2,
      availability: "available",
      locationDetails: "Near room 210",
      createdAt: { ".sv": "timestamp" },
    })
  })

  it("rejects an invalid floor before writing", async () => {
    await expect(createAmenitySubmission({
      user,
      buildingId: 200,
      amenityType: "microwave",
      floorNumber: 21,
      availability: "unknown",
      locationDetails: "",
      notes: "",
    })).rejects.toThrow("Enter a floor")

    expect(pushMock).not.toHaveBeenCalled()
    expect(setMock).not.toHaveBeenCalled()
  })
})
