import { onValue, push, ref, serverTimestamp, set } from "firebase/database"

import { amenityBranchForType, type AmenityType } from "@/data/amenities"
import type { AuthUser } from "@/lib/auth"
import { getFirebaseDatabase } from "@/lib/firebase"

export type AmenityReview = {
  id: string
  userId: string
  authorName: string
  authorPhotoURL: string | null
  rating: number
  comment: string
  createdAt: number
}

function recordValue(value: unknown, description: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`Invalid ${description}`)
  return value as Record<string, unknown>
}

function stringValue(value: unknown, description: string) {
  if (typeof value !== "string") throw new Error(`Invalid ${description}`)
  return value
}

function parseReview(value: unknown, id: string): AmenityReview {
  const data = recordValue(value, `review ${id}`)
  const rating = data.rating
  const createdAt = data.createdAt
  const authorPhotoURL = data.authorPhotoURL

  if (!Number.isInteger(rating) || Number(rating) < 1 || Number(rating) > 5) throw new Error(`Invalid rating for review ${id}`)
  if (typeof createdAt !== "number" || !Number.isFinite(createdAt)) throw new Error(`Invalid creation time for review ${id}`)
  if (authorPhotoURL !== undefined && typeof authorPhotoURL !== "string") throw new Error(`Invalid author photo for review ${id}`)

  return {
    id,
    userId: stringValue(data.userId, `user for review ${id}`),
    authorName: stringValue(data.authorName, `author for review ${id}`),
    authorPhotoURL: authorPhotoURL ?? null,
    rating: Number(rating),
    comment: stringValue(data.comment, `comment for review ${id}`),
    createdAt,
  }
}

function reviewsPath(buildingId: number, amenityType: AmenityType, amenityId: string) {
  return `reviewsByAmenity/${buildingId}/${amenityBranchForType(amenityType)}/${amenityId}`
}

export function observeAmenityReviews(
  buildingId: number,
  amenityType: AmenityType,
  amenityId: string,
  onChange: (reviews: AmenityReview[]) => void,
  onError: (error: unknown) => void,
) {
  return onValue(
    ref(getFirebaseDatabase(), reviewsPath(buildingId, amenityType, amenityId)),
    (snapshot) => {
      try {
        const value = snapshot.val()
        if (value === null) {
          onChange([])
          return
        }

        const reviews = Object.entries(recordValue(value, `reviews for amenity ${amenityId}`))
          .map(([id, review]) => parseReview(review, id))
          .sort((first, second) => second.createdAt - first.createdAt || second.id.localeCompare(first.id))
        onChange(reviews)
      } catch (error) {
        onError(error)
      }
    },
    onError,
  )
}

export async function createAmenityReview({
  buildingId,
  amenityType,
  amenityId,
  user,
  rating,
  comment,
}: {
  buildingId: number
  amenityType: AmenityType
  amenityId: string
  user: AuthUser
  rating: number
  comment: string
}) {
  const normalizedComment = comment.trim()
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Choose a rating from 1 to 5.")
  if (normalizedComment.length === 0 || normalizedComment.length > 1000) throw new Error("Enter a comment of 1 to 1,000 characters.")

  const reviewRef = push(ref(getFirebaseDatabase(), reviewsPath(buildingId, amenityType, amenityId)))
  await set(reviewRef, {
    userId: user.uid,
    authorName: user.displayName || "Campus user",
    ...(user.photoURL ? { authorPhotoURL: user.photoURL } : {}),
    rating,
    comment: normalizedComment,
    createdAt: serverTimestamp(),
  })
}
