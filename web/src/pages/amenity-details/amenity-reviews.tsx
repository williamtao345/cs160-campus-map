import { useState } from "react"
import { LogInIcon, StarIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import type { AuthUser } from "@/lib/auth"

const reviewRatings = ["1", "2", "3", "4", "5"]
const mockedReviews = [
  {
    id: "mock-review-1",
    authorName: "Maya Chen",
    authorInitials: "MC",
    rating: 5,
    date: "July 24, 2026",
    dateTime: "2026-07-24",
    comment: "Easy to locate, and the information on this page matched what I found.",
  },
  {
    id: "mock-review-2",
    authorName: "Jordan Lee",
    authorInitials: "JL",
    rating: 4,
    date: "July 18, 2026",
    dateTime: "2026-07-18",
    comment: "The location details were helpful. It was a little busy when I visited.",
  },
]

export function AmenityReviews({
  amenityId,
  authUser,
  isAuthLoading,
  isAuthPending,
  onSignIn,
}: {
  amenityId: string
  authUser: AuthUser | null
  isAuthLoading: boolean
  isAuthPending: boolean
  onSignIn: () => void
}) {
  const [rating, setRating] = useState("")

  return (
    <>
      <Separator />

      <section className="flex flex-col gap-4" aria-labelledby="reviews-heading">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 id="reviews-heading" className="font-heading text-lg font-medium">Reviews</h3>
            <p className="text-sm text-muted-foreground">{mockedReviews.length} reviews</p>
          </div>

          {isAuthLoading ? (
            <p role="status" className="text-sm text-muted-foreground">Checking sign-in...</p>
          ) : authUser ? (
            <Dialog>
              <DialogTrigger render={<Button type="button" variant="outline" />}>Write a review</DialogTrigger>
              <DialogContent forceBackdrop>
                <DialogHeader>
                  <DialogTitle>Write a review</DialogTitle>
                  <DialogDescription>Review submission is not enabled in this prototype.</DialogDescription>
                </DialogHeader>

                <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
                  <div className="flex flex-col gap-2">
                    <p id={`review-rating-${amenityId}`} className="text-sm font-medium">Rating</p>
                    <ToggleGroup
                      variant="outline"
                      size="lg"
                      value={rating ? [rating] : []}
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
                      placeholder="Share your experience with this amenity"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled>Reviews unavailable</Button>
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

        <div className="flex flex-col gap-4">
          {mockedReviews.map((review, index) => (
            <div key={review.id} className="flex flex-col gap-4">
              <article className="flex gap-3">
                <Avatar>
                  <AvatarFallback>{review.authorInitials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <h4 className="truncate font-medium">{review.authorName}</h4>
                      <time className="shrink-0 text-xs text-muted-foreground" dateTime={review.dateTime}>{review.date}</time>
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
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              </article>
              {index < mockedReviews.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
