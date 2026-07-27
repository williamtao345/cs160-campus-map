import { FirebaseError } from "firebase/app"
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from "firebase/auth"

import { getFirebaseApp } from "@/lib/firebase"

export type AuthUser = {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}

function authUser(user: { uid: string; displayName: string | null; email: string | null; photoURL: string | null }): AuthUser {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  }
}

export function observeAuthState(
  onChange: (user: AuthUser | null) => void,
  onError: (error: unknown) => void,
) {
  try {
    return onAuthStateChanged(
      getFirebaseAuth(),
      (user) => onChange(user ? authUser(user) : null),
      onError,
    )
  } catch (error) {
    onError(error)
    return () => undefined
  }
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth()
  await setPersistence(auth, browserLocalPersistence)
  return authUser((await signInWithPopup(auth, new GoogleAuthProvider())).user)
}

export function signOutCurrentUser() {
  return signOut(getFirebaseAuth())
}

export function authenticationErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") return null
    if (error.code === "auth/popup-blocked") return "Google sign-in was blocked by the browser. Allow popups and try again."
  }

  return "Google sign-in could not be completed. Please try again."
}
