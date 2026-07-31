import { useState } from "react"
import type { FormEvent } from "react"
import { LogInIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FormSelect } from "@/components/forms/form-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AmenityType, Building } from "@/data/amenities"
import {
  createAmenitySubmission,
  type AmenityAvailability,
} from "@/data/amenity-submissions"
import type { AuthUser } from "@/lib/auth"

const amenityTypes = [
  { label: "Restroom", value: "restroom" },
  { label: "Water refill station", value: "waterRefillStation" },
  { label: "Vending machine", value: "vendingMachine" },
  { label: "Study space", value: "studySpace" },
  { label: "Lactation room", value: "lactationRoom" },
  { label: "Microwave", value: "microwave" },
  { label: "Zero-waste station", value: "zeroWasteStation" },
  { label: "Eatery", value: "eatery" },
  { label: "Campus garden", value: "campusGarden" },
  { label: "Basic needs service", value: "basicNeedService" },
  { label: "Changing table", value: "changingTable" },
  { label: "Menstrual product dispenser", value: "menstrualProduct" },
]

const availabilityOptions = [
  { label: "Available", value: "available" },
  { label: "Out of service", value: "outOfService" },
  { label: "Unknown", value: "unknown" },
]

export function CreateAmenityPage({
  buildings,
  authUser,
  isAuthLoading,
  isAuthPending,
  onSignIn,
}: {
  buildings: Building[]
  authUser: AuthUser | null
  isAuthLoading: boolean
  isAuthPending: boolean
  onSignIn: () => void
}) {
  const [type, setType] = useState("")
  const [building, setBuilding] = useState("")
  const [availability, setAvailability] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const buildingOptions = buildings.map((buildingOption) => ({
    label: buildingOption.name,
    value: String(buildingOption.id),
  }))

  async function submitAmenity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!authUser) return

    const form = event.currentTarget
    const formData = new FormData(form)
    setIsSubmitting(true)
    setSubmissionError("")
    setSubmitted(false)
    try {
      await createAmenitySubmission({
        user: authUser,
        buildingId: Number(building),
        amenityType: type as AmenityType,
        floorNumber: Number(formData.get("floor")),
        availability: availability as AmenityAvailability,
        locationDetails: String(formData.get("locationDetails") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      })
      form.reset()
      setType("")
      setBuilding("")
      setAvailability("")
      setSubmitted(true)
    } catch {
      setSubmissionError("Amenity could not be submitted. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section aria-labelledby="create-heading">
      <h2 id="create-heading" className="font-heading text-xl font-medium">Add an amenity</h2>
      <p className="mt-2 text-sm text-muted-foreground">All submissions will be manually reviewed.</p>
      {isAuthLoading ? (
        <p role="status" className="mt-5 text-sm text-muted-foreground">Checking sign-in...</p>
      ) : !authUser ? (
        <Button type="button" className="mt-5" disabled={isAuthPending} onClick={onSignIn}>
          <LogInIcon data-icon="inline-start" aria-hidden="true" />
          {isAuthPending ? "Signing in..." : "Sign in to submit"}
        </Button>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={submitAmenity}>
          <p className="text-sm text-muted-foreground"><span className="text-destructive" aria-hidden="true">*</span> Required fields</p>
          <FormSelect id="type" label="Amenity type" placeholder="Select a type" options={amenityTypes} value={type} required onValueChange={setType} />
          <FormSelect id="building" label="Building" placeholder="Select a building" options={buildingOptions} value={building} required onValueChange={setBuilding} />
          <div className="space-y-2">
            <Label htmlFor="floor">Floor <span className="text-destructive" aria-hidden="true">*</span></Label>
            <Input id="floor" name="floor" type="number" min="0" max="20" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-details">Location details</Label>
            <Input id="location-details" name="locationDetails" maxLength={200} placeholder="Room, hallway, or nearby landmark" />
          </div>
          <FormSelect id="availability" label="Availability" placeholder="Select availability" options={availabilityOptions} value={availability} required onValueChange={setAvailability} />
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={4} maxLength={1000} />
          </div>
          {submissionError && <p role="alert" className="text-sm text-destructive">{submissionError}</p>}
          {submitted && <p role="status" className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">Amenity submitted for review.</p>}
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit amenity"}
          </Button>
        </form>
      )}
    </section>
  )
}
