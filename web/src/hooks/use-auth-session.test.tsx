import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuthSession } from "@/hooks/use-auth-session"
import {
  authenticationErrorMessage,
  observeAuthState,
  signInWithGoogle,
  signOutCurrentUser,
  type AuthUser,
} from "@/lib/auth"

vi.mock("@/lib/auth", () => ({
  authenticationErrorMessage: vi.fn(),
  observeAuthState: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOutCurrentUser: vi.fn(),
}))

const user: AuthUser = {
  uid: "user-1",
  displayName: "Test User",
  email: "test@example.com",
  photoURL: null,
}

describe("useAuthSession", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(observeAuthState).mockImplementation((onChange) => {
      onChange(null)
      return () => undefined
    })
  })

  it("observes authentication state and unsubscribes", () => {
    const unsubscribe = vi.fn()
    let updateUser!: (user: AuthUser | null) => void
    vi.mocked(observeAuthState).mockImplementation((onChange) => {
      updateUser = onChange
      return unsubscribe
    })

    const { result, unmount } = renderHook(() => useAuthSession())
    expect(result.current.isInitializing).toBe(true)

    act(() => updateUser(user))
    expect(result.current.isInitializing).toBe(false)
    expect(result.current.user).toEqual(user)

    unmount()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it("handles sign-in errors and silent cancellation", async () => {
    vi.mocked(signInWithGoogle).mockRejectedValue(new Error("Popup failed"))
    vi.mocked(authenticationErrorMessage).mockReturnValueOnce(null)
    const { result } = renderHook(() => useAuthSession())
    let signInResult: string | null | undefined

    await act(async () => {
      signInResult = await result.current.signIn()
    })
    expect(result.current.error).toBe("")
    expect(signInResult).toBeNull()

    vi.mocked(authenticationErrorMessage).mockReturnValueOnce("Google sign-in could not be completed. Please try again.")
    await act(async () => {
      signInResult = await result.current.signIn()
    })
    expect(result.current.error).toBe("Google sign-in could not be completed. Please try again.")
    expect(signInResult).toBe("Google sign-in could not be completed. Please try again.")
    expect(result.current.isPending).toBe(false)
  })

  it("reports sign-out failures without clearing the current user", async () => {
    vi.mocked(observeAuthState).mockImplementation((onChange) => {
      onChange(user)
      return () => undefined
    })
    vi.mocked(signOutCurrentUser).mockRejectedValue(new Error("Network error"))
    const { result } = renderHook(() => useAuthSession())

    await act(() => result.current.signOut())

    expect(result.current.error).toBe("Sign out could not be completed. Please try again.")
    expect(result.current.user).toEqual(user)
    expect(result.current.isPending).toBe(false)
  })
})
