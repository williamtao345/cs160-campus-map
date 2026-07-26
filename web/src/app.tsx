import { useRef, useState } from "react"
import type { FormEvent } from "react"

import { CampusMap } from "@/components/campus-map"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { amenities, type Amenity } from "@/data/amenities"

type DrawerView = "search" | "details" | "create" | "settings"

const amenityTypes = ["Restroom", "Water refill station", "Vending machine", "Study space", "Food", "Other"]
const buildings = ["Soda Hall", "Cory Hall", "GSPP", "Sutardja Dai Hall"]
const collapsedSnapPoint = "11rem"

function AvailabilityBadge({ availability }: { availability: Amenity["availability"] }) {
  const variant = availability === "Out of service" ? "destructive" : availability === "Unknown" ? "outline" : "secondary"
  return <Badge variant={variant}>{availability}</Badge>
}

function SearchView({
  hasSearched,
  query,
  onQueryChange,
  onSearch,
  onSelect,
}: {
  hasSearched: boolean
  query: string
  onQueryChange: (query: string) => void
  onSearch: () => void
  onSelect: (amenity: Amenity) => void
}) {
  return (
    <section className="space-y-4" aria-labelledby="search-heading">
      <h2 id="search-heading" className="sr-only">Search campus amenities</h2>
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          onSearch()
        }}
      >
        <Input
          name="query"
          type="search"
          aria-label="Search by amenity or building"
          placeholder="Search amenities or buildings"
          className="h-9"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <Button type="submit">Search</Button>
      </form>

      <Separator />

      <section className="space-y-3" aria-labelledby="amenities-heading" aria-live="polite">
        <h2 id="amenities-heading" className="text-sm font-medium">Campus Amenities</h2>
        {!hasSearched && <p className="text-sm text-muted-foreground">Nearby amenities will appear here.</p>}
        {hasSearched && amenities.map((amenity) => (
          <button key={amenity.id} type="button" className="block w-full rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => onSelect(amenity)}>
            <Card size="sm" className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>{amenity.type}</CardTitle>
                <CardAction><AvailabilityBadge availability={amenity.availability} /></CardAction>
                <CardDescription>{amenity.building} · Floor {amenity.floor}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Rating: {amenity.rating}/5</CardContent>
            </Card>
          </button>
        ))}
      </section>
    </section>
  )
}

function AmenityDetails({ amenity }: { amenity: Amenity }) {
  const details = [
    ["Rating", amenity.rating ? `${amenity.rating}/5` : "Not rated"],
    ["Hours", amenity.hours || "Not provided"],
    ["Accessibility", amenity.accessibility],
    ["Location details", amenity.locationDetails || "Not provided"],
    ["Notes", amenity.notes || "Not provided"],
  ]

  return (
    <article className="space-y-5">
      <header className="space-y-1">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-heading text-xl font-medium">{amenity.type}</h2>
          <AvailabilityBadge availability={amenity.availability} />
        </div>
        <p className="text-sm text-muted-foreground">{amenity.building} · Floor {amenity.floor}</p>
      </header>
      <dl className="space-y-3 text-sm">
        {details.map(([term, description]) => (
          <div key={term} className="flex justify-between gap-6 border-b pb-3 last:border-0">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className="text-right font-medium">{description}</dd>
          </div>
        ))}
      </dl>
      <p className="text-right text-xs text-muted-foreground">Last reported {amenity.lastReported}</p>
    </article>
  )
}

type FormSelectProps = {
  id: string
  label: string
  placeholder: string
  options: string[]
  value: string
  required?: boolean
  onValueChange: (value: string) => void
}

function FormSelect({ id, label, placeholder, options, value, required, onValueChange }: FormSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}{required && <span className="text-destructive" aria-hidden="true">*</span>}</Label>
      <Select name={id} value={value} required={required} onValueChange={(nextValue) => {
        if (nextValue !== null) onValueChange(nextValue)
      }}>
        <SelectTrigger id={id} className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

function CreateAmenityForm() {
  const [type, setType] = useState("")
  const [building, setBuilding] = useState("")
  const [availability, setAvailability] = useState("")
  const [accessibility, setAccessibility] = useState("")
  const [rating, setRating] = useState("Not rated")
  const [success, setSuccess] = useState("")
  const statusRef = useRef<HTMLParagraphElement>(null)

  function submitAmenity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccess(`${type} at ${building} was submitted for review.`)
    event.currentTarget.reset()
    setType("")
    setBuilding("")
    setAvailability("")
    setAccessibility("")
    setRating("Not rated")
    requestAnimationFrame(() => statusRef.current?.focus())
  }

  return (
    <section aria-labelledby="create-heading">
      <h2 id="create-heading" className="font-heading text-xl font-medium">Add an amenity</h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground"><span className="text-destructive" aria-hidden="true">*</span> Required fields</p>
      <form className="space-y-4" onSubmit={submitAmenity} onInput={() => setSuccess("")}>
        <FormSelect id="type" label="Amenity type" placeholder="Select a type" options={amenityTypes} value={type} required onValueChange={setType} />
        <FormSelect id="building" label="Building" placeholder="Select a building" options={buildings} value={building} required onValueChange={setBuilding} />
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
        <Button type="submit" size="lg" className="w-full">Submit amenity</Button>
      </form>
      {success && <p ref={statusRef} role="status" tabIndex={-1} className="mt-4 rounded-lg bg-secondary p-3 text-sm font-medium">{success}</p>}
    </section>
  )
}

function SettingsView({ email, onSave }: { email: string; onSave: (email: string) => void }) {
  const [draftEmail, setDraftEmail] = useState(email)
  const [success, setSuccess] = useState(false)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draftEmail)

  function saveEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isValid || draftEmail === email) return

    onSave(draftEmail)
    setSuccess(true)
    requestAnimationFrame(() => statusRef.current?.focus())
  }

  return (
    <section aria-labelledby="settings-heading">
      <h2 id="settings-heading" className="font-heading text-xl font-medium">Settings</h2>
      <form className="mt-5 space-y-4" onSubmit={saveEmail}>
        <div className="space-y-2">
          <Label htmlFor="settings-email">Email</Label>
          <Input
            id="settings-email"
            name="email"
            type="email"
            autoComplete="email"
            value={draftEmail}
            required
            aria-invalid={draftEmail.length > 0 && !isValid}
            onChange={(event) => {
              setDraftEmail(event.target.value)
              setSuccess(false)
            }}
          />
          <p className="text-sm text-muted-foreground">This email is stored for this session only.</p>
        </div>
        <Button type="submit" disabled={!isValid || draftEmail === email}>Save</Button>
      </form>
      {success && (
        <p ref={statusRef} role="status" tabIndex={-1} className="mt-4 rounded-lg bg-secondary p-3 text-sm font-medium">
          Email saved for this session.
        </p>
      )}
    </section>
  )
}

export function App() {
  const [view, setView] = useState<DrawerView>("search")
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null)
  const [snapPoint, setSnapPoint] = useState<string | number>(collapsedSnapPoint)
  const [email, setEmail] = useState("x.tao@berkeley.edu")
  const [searchQuery, setSearchQuery] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  function showView(nextView: DrawerView) {
    setView(nextView)
    const hasSavedResults = hasSearched && amenities.length > 0
    setSnapPoint(nextView === "search" && !hasSavedResults ? collapsedSnapPoint : 1)
  }

  return (
    <main className="app-shell">
      <h1 className="sr-only">UC Berkeley Campus Amenities</h1>
      <CampusMap />

      <nav className="top-actions" aria-label="App actions">
        <Button type="button" className="bg-accent text-[var(--berkeley-blue-dark)] hover:bg-accent/80" onClick={() => showView("create")}>Create</Button>
        <Button type="button" onClick={() => showView("settings")}>Settings</Button>
      </nav>

      <Drawer
        open
        modal={false}
        disablePointerDismissal
        showSwipeHandle
        snapPoints={[collapsedSnapPoint, 1]}
        snapPoint={snapPoint}
        snapToSequentialPoints
        onOpenChange={(open, eventDetails) => {
          if (!open) eventDetails.cancel()
        }}
        onSnapPointChange={(nextSnapPoint) => {
          if (nextSnapPoint !== null) setSnapPoint(nextSnapPoint)
        }}
      >
        <DrawerContent>
          <DrawerTitle className="sr-only">Campus information</DrawerTitle>
          <DrawerDescription className="sr-only">Search, view, and add campus amenities.</DrawerDescription>
          <div className="drawer-main-content flex-1 overflow-y-auto overscroll-contain p-4">
            <div className="mx-auto max-w-lg">
              {view !== "search" && <Button type="button" variant="outline" className="mb-5" onClick={() => showView("search")}>Back</Button>}
              {view === "search" && (
                <SearchView
                  hasSearched={hasSearched}
                  query={searchQuery}
                  onQueryChange={setSearchQuery}
                  onSearch={() => {
                    setHasSearched(true)
                    if (amenities.length > 0) setSnapPoint(1)
                  }}
                  onSelect={(amenity) => { setSelectedAmenity(amenity); showView("details") }}
                />
              )}
              {view === "details" && selectedAmenity && <AmenityDetails amenity={selectedAmenity} />}
              {view === "create" && <CreateAmenityForm />}
              {view === "settings" && <SettingsView email={email} onSave={setEmail} />}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </main>
  )
}
