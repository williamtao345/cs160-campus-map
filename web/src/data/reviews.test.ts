import { beforeEach, describe, expect, it, vi } from "vitest"

import { createAmenityReview, observeAmenityReviews } from "@/data/reviews"
import type { AuthUser } from "@/lib/auth"

const {
  onValueMock,
  pushMock,
  refMock,
  serverTimestampMock,
  setMock,
} = vi.hoisted(() => ({
  onValueMock: vi.fn(),
  pushMock: vi.fn(),
  refMock: vi.fn(),
  serverTimestampMock: vi.fn(() => ({ ".sv": "timestamp" })),
  setMock: vi.fn(),
}))

vi.mock("firebase/database", () => ({
  get: vi.fn(),
  onValue: onValueMock,
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
  displayName: "  Test User  ",
  email: "test@example.com",
  photoURL: "https://example.com/avatar.jpg",
}

describe("observeAmenityReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    refMock.mockImplementation((_database, path) => ({ path }))
  })

  it("loads newest reviews first from the building and amenity path", () => {
    const unsubscribe = vi.fn()
    onValueMock.mockImplementation((_reference, onChange) => {
      onChange({
        val: () => ({
          older: {
            userId: "user-2",
            authorName: "Older User",
            rating: 3,
            comment: "An older review.",
            createdAt: 100,
          },
          newer: {
            userId: "user-1",
            authorName: "Newer User",
            authorPhotoURL: "https://example.com/newer.jpg",
            rating: 5,
            comment: "A newer review.",
            createdAt: 200,
          },
        }),
      })
      return unsubscribe
    })
    const onChange = vi.fn()

    const result = observeAmenityReviews(200, "restroom", "restroom_1", onChange, vi.fn())

    expect(refMock).toHaveBeenCalledWith({ database: true }, "reviewsByAmenity/200/restrooms/restroom_1")
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "newer", authorPhotoURL: "https://example.com/newer.jpg" }),
      expect.objectContaining({ id: "older", authorPhotoURL: null }),
    ])
    expect(result).toBe(unsubscribe)
  })

  it("reports invalid records instead of displaying partial data", () => {
    onValueMock.mockImplementation((_reference, onChange) => {
      onChange({ val: () => ({ invalid: { rating: 9 } }) })
      return vi.fn()
    })
    const onChange = vi.fn()
    const onError = vi.fn()

    observeAmenityReviews(200, "restroom", "restroom_1", onChange, onError)

    expect(onChange).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })
})

describe("createAmenityReview", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    refMock.mockImplementation((_database, path) => ({ path }))
    pushMock.mockReturnValue({ key: "new-review" })
    setMock.mockResolvedValue(undefined)
  })

  it("creates a normalized review without storing the user's email", async () => {
    await createAmenityReview({
      buildingId: 200,
      amenityType: "restroom",
      amenityId: "restroom_1",
      user,
      rating: 4,
      comment: "  Easy to find.  ",
    })

    expect(pushMock).toHaveBeenCalledWith({ path: "reviewsByAmenity/200/restrooms/restroom_1" })
    expect(setMock).toHaveBeenCalledWith({ key: "new-review" }, {
      userId: "google-user-1",
      authorName: "  Test User  ",
      authorPhotoURL: "https://example.com/avatar.jpg",
      rating: 4,
      comment: "Easy to find.",
      createdAt: { ".sv": "timestamp" },
    })
    expect(setMock.mock.calls[0][1]).not.toHaveProperty("email")
  })

  it("rejects an empty comment before writing", async () => {
    await expect(createAmenityReview({
      buildingId: 200,
      amenityType: "restroom",
      amenityId: "restroom_1",
      user,
      rating: 4,
      comment: "   ",
    })).rejects.toThrow("Enter a comment")

    expect(pushMock).not.toHaveBeenCalled()
    expect(setMock).not.toHaveBeenCalled()
  })
})
