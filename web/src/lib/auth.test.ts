import { beforeEach, describe, expect, it, vi } from "vitest"

import { observeAuthState } from "@/lib/auth"

const { getFirebaseAppMock, onAuthStateChangedMock } = vi.hoisted(() => ({
  getFirebaseAppMock: vi.fn(),
  onAuthStateChangedMock: vi.fn(),
}))

vi.mock("firebase/app", () => ({
  FirebaseError: class FirebaseError extends Error {},
}))

vi.mock("firebase/auth", () => ({
  browserLocalPersistence: {},
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: class GoogleAuthProvider {},
  onAuthStateChanged: onAuthStateChangedMock,
  setPersistence: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock("@/lib/firebase", () => ({
  getFirebaseApp: getFirebaseAppMock,
}))

describe("observeAuthState", () => {
  beforeEach(() => {
    getFirebaseAppMock.mockReset()
    onAuthStateChangedMock.mockReset()
  })

  it("reports synchronous Firebase initialization errors", () => {
    const error = new Error("Firebase is not configured")
    const onError = vi.fn()
    getFirebaseAppMock.mockImplementation(() => {
      throw error
    })

    const unsubscribe = observeAuthState(vi.fn(), onError)

    expect(onError).toHaveBeenCalledWith(error)
    expect(unsubscribe()).toBeUndefined()
  })

  it("forwards asynchronous authentication observer errors", () => {
    const error = new Error("Authentication unavailable")
    const onError = vi.fn()
    const unsubscribe = vi.fn()
    getFirebaseAppMock.mockReturnValue({})
    onAuthStateChangedMock.mockImplementation((_auth, _onChange, observerError) => {
      observerError(error)
      return unsubscribe
    })

    expect(observeAuthState(vi.fn(), onError)).toBe(unsubscribe)
    expect(onError).toHaveBeenCalledWith(error)
  })
})
