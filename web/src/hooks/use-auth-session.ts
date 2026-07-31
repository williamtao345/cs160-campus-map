import { useEffect, useState } from "react"

import {
  authenticationErrorMessage,
  observeAuthState,
  signInWithGoogle,
  signOutCurrentUser,
  type AuthUser,
} from "@/lib/auth"

export function useAuthSession() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState("")
  const [isInitializing, setIsInitializing] = useState(true)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => observeAuthState(
    (nextUser) => {
      setUser(nextUser)
      setIsInitializing(false)
    },
    () => {
      setError("Authentication could not be initialized. Check the Firebase configuration and try again.")
      setIsInitializing(false)
    },
  ), [])

  async function signIn() {
    setError("")
    setIsPending(true)
    try {
      setUser(await signInWithGoogle())
      return null
    } catch (signInError) {
      const message = authenticationErrorMessage(signInError)
      if (message) setError(message)
      return message
    } finally {
      setIsPending(false)
    }
  }

  async function signOut() {
    setError("")
    setIsPending(true)
    try {
      await signOutCurrentUser()
      setUser(null)
    } catch {
      setError("Sign out could not be completed. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  return {
    error,
    isInitializing,
    isPending,
    signIn,
    signOut,
    user,
  }
}
