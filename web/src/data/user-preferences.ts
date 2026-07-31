import { get, ref, set } from "firebase/database"

import { getFirebaseDatabase } from "@/lib/firebase"

export const genderPreferences = ["Woman", "Man", "Non-binary", "Prefer not to say"] as const

export type GenderPreference = (typeof genderPreferences)[number]

export type UserPreferences = {
  gender: GenderPreference
}

function parseUserPreferences(value: unknown): UserPreferences {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Invalid user preferences")
  }

  const record = value as Record<string, unknown>
  if (Object.keys(record).some((key) => key !== "gender") || !genderPreferences.includes(record.gender as GenderPreference)) {
    throw new Error("Invalid user preferences")
  }

  return { gender: record.gender as GenderPreference }
}

export async function loadUserPreferences(uid: string): Promise<UserPreferences | null> {
  const snapshot = await get(ref(getFirebaseDatabase(), `userPreferences/${uid}`))
  const value = snapshot.val()
  return value === null ? null : parseUserPreferences(value)
}

export async function saveUserPreferences(uid: string, preferences: UserPreferences): Promise<void> {
  const validatedPreferences = parseUserPreferences(preferences)
  await set(ref(getFirebaseDatabase(), `userPreferences/${uid}`), validatedPreferences)
}
