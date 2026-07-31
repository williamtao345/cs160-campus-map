import { useState } from "react"
import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { FormSelect } from "@/components/forms/form-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Building } from "@/data/amenities"

const amenityTypes = [
  "Restroom",
  "Water refill station",
  "Vending machine",
  "Study space",
  "Lactation room",
  "Microwave",
  "Zero-waste station",
  "Eatery",
  "Campus garden",
  "Basic needs service",
  "Changing table",
  "Menstrual product dispenser",
]

export function CreateAmenityPage({ buildings }: { buildings: Building[] }) {
  const [type, setType] = useState("")
  const [building, setBuilding] = useState("")
  const [availability, setAvailability] = useState("")
  const [accessibility, setAccessibility] = useState("")
  const [rating, setRating] = useState("Not rated")
  const buildingOptions = buildings.map((buildingOption) => buildingOption.name)

  function submitAmenity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <section aria-labelledby="create-heading">
      <h2 id="create-heading" className="font-heading text-xl font-medium">Add an amenity</h2>
      <p className="mt-2 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
        Amenity submissions are not enabled yet.
      </p>
      <p className="mt-1 mb-5 text-sm text-muted-foreground"><span className="text-destructive" aria-hidden="true">*</span> Required fields</p>
      <form className="space-y-4" onSubmit={submitAmenity}>
        <FormSelect id="type" label="Amenity type" placeholder="Select a type" options={amenityTypes} value={type} required onValueChange={setType} />
        <FormSelect id="building" label="Building" placeholder="Select a building" options={buildingOptions} value={building} required onValueChange={setBuilding} />
        <div className="space-y-2">
          <Label htmlFor="floor">Floor <span className="text-destructive" aria-hidden="true">*</span></Label>
          <Input id="floor" name="floor" type="number" min="0" max="20" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location-details">Location details</Label>
          <Input id="location-details" name="locationDetails" placeholder="Room, hallway, or nearby landmark" />
        </div>
        <FormSelect id="availability" label="Availability" placeholder="Select availability" options={["Available", "Out of service", "Unknown"]} value={availability} required onValueChange={setAvailability} />
        <FormSelect id="accessibility" label="Accessibility" placeholder="Select accessibility" options={["Accessible", "Not accessible", "Unknown"]} value={accessibility} required onValueChange={setAccessibility} />
        <div className="space-y-2">
          <Label htmlFor="hours">Operating hours</Label>
          <Input id="hours" name="hours" placeholder="For example, 8:00 AM-5:00 PM" />
        </div>
        <FormSelect id="rating" label="Rating" placeholder="Not rated" options={["Not rated", "1 - Poor", "2", "3 - Average", "4", "5 - Excellent"]} value={rating} onValueChange={setRating} />
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={4} />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled>Submissions unavailable</Button>
      </form>
    </section>
  )
}
