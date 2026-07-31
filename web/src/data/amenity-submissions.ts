import { push, ref, serverTimestamp, set } from "firebase/database"

import type { AmenityType } from "@/data/amenities"
import type { AuthUser } from "@/lib/auth"
import { getFirebaseDatabase } from "@/lib/firebase"

export type AmenityAvailability = "available" | "outOfService" | "unknown"

export async function createAmenitySubmission({
  user,
  buildingId,
  amenityType,
  floorNumber,
  availability,
  locationDetails,
  notes,
}: {
  user: AuthUser
  buildingId: number
  amenityType: AmenityType
  floorNumber: number
  availability: AmenityAvailability
  locationDetails: string
  notes: string
}) {
  const normalizedLocation = locationDetails.trim()
  const normalizedNotes = notes.trim()

  if (!Number.isInteger(buildingId) || buildingId < 1) throw new Error("Choose a building.")
  if (!Number.isInteger(floorNumber) || floorNumber < 0 || floorNumber > 20) throw new Error("Enter a floor from 0 to 20.")
  if (normalizedLocation.length > 200) throw new Error("Location details must be 200 characters or fewer.")
  if (normalizedNotes.length > 1000) throw new Error("Notes must be 1,000 characters or fewer.")

  const submissionRef = push(ref(getFirebaseDatabase(), `amenitySubmissions/${user.uid}`))
  await set(submissionRef, {
    userId: user.uid,
    buildingId,
    amenityType,
    floorNumber,
    availability,
    ...(normalizedLocation ? { locationDetails: normalizedLocation } : {}),
    ...(normalizedNotes ? { notes: normalizedNotes } : {}),
    createdAt: serverTimestamp(),
  })
}
