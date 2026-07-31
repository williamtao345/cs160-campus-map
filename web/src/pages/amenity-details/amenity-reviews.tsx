import { useEffect, useState, type FormEvent } from "react"
import { LogInIcon, StarIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { AmenityType } from "@/data/amenities"
import { createAmenityReview, observeAmenityReviews, type AmenityReview } from "@/data/reviews"
import type { AuthUser } from "@/lib/auth"

const reviewRatings = ["1", "2", "3", "4", "5"]

function authorInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CU"
}

function reviewDate(createdAt: number) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(createdAt)
}

export function AmenityReviews({
  buildingId,
  amenityType,
  amenityId,
  authUser,
  isAuthLoading,
  isAuthPending,
  onSignIn,
}: {
  buildingId: number
  amenityType: AmenityType
  amenityId: string
  authUser: AuthUser | null
  isAuthLoading: boolean
  isAuthPending: boolean
  onSignIn: () => void
}) {
  const [reviews, setReviews] = useState<AmenityReview[]>([])
  const [reviewsStatus, setReviewsStatus] = useState<"loading" | "ready" | "error">("loading")
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [rating, setRating] = useState("")
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState("")

  useEffect(() => {
    setReviews([])
    setReviewsStatus("loading")
    return observeAmenityReviews(
      buildingId,
      amenityType,
      amenityId,
      (nextReviews) => {
        setReviews(nextReviews)
        setReviewsStatus("ready")
      },
      () => {
        setReviews([])
        setReviewsStatus("error")
      },
    )
  }, [amenityId, amenityType, buildingId, loadAttempt])

  function updateDialogOpen(open: boolean) {
    if (!open && isSubmitting) return
    setIsDialogOpen(open)
    if (!open && !isSubmitting) {
      setRating("")
      setComment("")
      setSubmissionError("")
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!authUser) return

    setIsSubmitting(true)
    setSubmissionError("")
    try {
      await createAmenityReview({
        buildingId,
        amenityType,
        amenityId,
        user: authUser,
        rating: Number(rating),
        comment,
      })
      setIsDialogOpen(false)
      setRating("")
      setComment("")
    } catch {
      setSubmissionError("Review could not be submitted. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Separator />

      <section className="flex flex-col gap-4" aria-labelledby="reviews-heading">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 id="reviews-heading" className="font-heading text-lg font-medium">Reviews</h3>
            {reviewsStatus === "ready" && (
              <p className="text-sm text-muted-foreground">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
            )}
          </div>

          {isAuthLoading ? (
            <p role="status" className="text-sm text-muted-foreground">Checking sign-in...</p>
          ) : authUser ? (
            <Dialog open={isDialogOpen} onOpenChange={updateDialogOpen}>
              <DialogTrigger render={<Button type="button" variant="outline" />}>Write a review</DialogTrigger>
              <DialogContent forceBackdrop>
                <DialogHeader>
                  <DialogTitle>Write a review</DialogTitle>
                  <DialogDescription>Your name, profile photo, rating, and comment will be public.</DialogDescription>
                </DialogHeader>

                <form className="flex flex-col gap-4" onSubmit={submitReview}>
                  <div className="flex flex-col gap-2">
                    <p id={`review-rating-${amenityId}`} className="text-sm font-medium">Rating</p>
                    <ToggleGroup
                      variant="outline"
                      size="lg"
                      value={rating ? [rating] : []}
                      disabled={isSubmitting}
                      aria-labelledby={`review-rating-${amenityId}`}
                      onValueChange={(values) => {
                        const nextRating = values[0]
                        if (nextRating) setRating(nextRating)
                      }}
                    >
                      {reviewRatings.map((value) => (
                        <ToggleGroupItem key={value} value={value} aria-label={`${value} star${value === "1" ? "" : "s"}`}>
                          <StarIcon fill={Number(value) <= Number(rating) ? "currentColor" : "none"} aria-hidden="true" />
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`review-comment-${amenityId}`}>Comment</Label>
                    <Textarea
                      id={`review-comment-${amenityId}`}
                      name="comment"
                      rows={3}
                      value={comment}
                      required
                      maxLength={1000}
                      disabled={isSubmitting}
                      placeholder="Share your experience with this amenity"
                      onChange={(event) => setComment(event.target.value)}
                    />
                  </div>
                  {submissionError && <p role="alert" className="text-sm text-destructive">{submissionError}</p>}
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting || !rating || !comment.trim()}>
                      {isSubmitting ? "Posting..." : "Post review"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button type="button" variant="outline" disabled={isAuthPending} onClick={onSignIn}>
              <LogInIcon data-icon="inline-start" aria-hidden="true" />
              {isAuthPending ? "Signing in..." : "Sign in to review"}
            </Button>
          )}
        </div>

        {reviewsStatus === "loading" ? (
          <p role="status" className="text-sm text-muted-foreground">Loading reviews...</p>
        ) : reviewsStatus === "error" ? (
          <div className="flex items-center justify-between gap-3">
            <p role="alert" className="text-sm text-destructive">Reviews could not be loaded.</p>
            <Button type="button" variant="outline" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Try again</Button>
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share your experience.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((review, index) => (
              <div key={review.id} className="flex flex-col gap-4">
                <article className="flex gap-3">
                  <Avatar>
                    {review.authorPhotoURL && <AvatarImage src={review.authorPhotoURL} alt="" />}
                    <AvatarFallback>{authorInitials(review.authorName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-baseline gap-2">
                        <h4 className="truncate font-medium">{review.authorName}</h4>
                        <time className="shrink-0 text-xs text-muted-foreground" dateTime={new Date(review.createdAt).toISOString()}>{reviewDate(review.createdAt)}</time>
                      </div>
                      <div className="flex shrink-0 gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                        {reviewRatings.map((value) => (
                          <StarIcon
                            key={value}
                            className="size-3.5"
                            fill={Number(value) <= review.rating ? "currentColor" : "none"}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="break-words text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                </article>
                {index < reviews.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
