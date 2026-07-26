import { useRef, useState } from "react"
import type { FormEvent } from "react"

import { CampusMap } from "@/components/campus-map"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { buildings, searchRestrooms, type Restroom } from "@/data/restrooms"

type DrawerView = "search" | "details" | "create" | "settings"

const amenityTypes = ["Restroom", "Water refill station", "Vending machine", "Study space", "Food", "Other"]
const buildingOptions = buildings.map((building) => building.name)
const collapsedSnapPoint = "11rem"
const resultLimit = 50

function categoryLabel(category: Restroom["category"]) {
  if (category === "women") return "Women's"
  if (category === "men") return "Men's"
  return "Gender-inclusive"
}

function AccessibilityBadge({ accessible }: { accessible: boolean }) {
  return (
    <Badge
      variant="outline"
      className={accessible ? "border-0 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : undefined}
    >
      {accessible ? "Accessible" : "Not accessible"}
    </Badge>
  )
}

function RestroomResult({ restroom, onSelect }: { restroom: Restroom; onSelect: () => void }) {
  return (
    <button type="button" className="block w-full rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={onSelect}>
      <div className="flex w-full items-start justify-between gap-4 rounded-xl bg-card p-3 text-sm text-card-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted/50">
        <div className="min-w-0 flex-1">
          <p className="font-heading font-medium leading-snug">{categoryLabel(restroom.category)} restroom</p>
          <p className="mt-1 text-muted-foreground">{restroom.building.name} {restroom.location}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <AccessibilityBadge accessible={restroom.accessible} />
          {restroom.stallType && <Badge variant="outline">{restroom.stallType === "single" ? "Single-stall" : "Multi-stall"}</Badge>}
          {restroom.restrictedAccess && <Badge variant="outline">Restricted access</Badge>}
        </div>
      </div>
    </button>
  )
}

function SearchView({
  hasSearched,
  query,
  onQueryChange,
  onSearch,
  onSelect,
  results,
  totalResultCount,
}: {
  hasSearched: boolean
  query: string
  onQueryChange: (query: string) => void
  onSearch: () => void
  onSelect: (restroom: Restroom) => void
  results: Restroom[]
  totalResultCount: number
}) {
  return (
    <section className="space-y-4" aria-labelledby="search-heading">
      <h2 id="search-heading" className="sr-only">Search campus restrooms</h2>
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
          aria-label="Search by restroom or building"
          placeholder="Search restrooms or buildings"
          className="h-9"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <Button type="submit">Search</Button>
      </form>

      <Separator />

      <section className="space-y-3" aria-labelledby="amenities-heading" aria-live="polite">
        <h2 id="amenities-heading" className="text-sm font-medium">Campus Restrooms</h2>
        {!hasSearched && <p className="text-sm text-muted-foreground">Search by building name to find restrooms.</p>}
        {hasSearched && totalResultCount === 0 && <p className="text-sm text-muted-foreground">No restrooms found for this building.</p>}
        {hasSearched && totalResultCount > 0 && (
          <p className="text-sm text-muted-foreground">
            Showing {results.length.toLocaleString()} of {totalResultCount.toLocaleString()} results.
          </p>
        )}
        {results.length > 0 && (
          <div className="flex flex-col gap-3">
            {results.map((restroom) => (
              <RestroomResult key={restroom.id} restroom={restroom} onSelect={() => onSelect(restroom)} />
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

function RestroomDetails({ restroom }: { restroom: Restroom }) {
  const details = [
    ["Location", restroom.location],
    ["Accessibility", restroom.accessible ? "Accessible" : "Not accessible"],
    ...(restroom.stallType ? [["Stall type", `${restroom.stallType === "single" ? "Single" : "Multi"}-stall`]] : []),
    ["Access", restroom.restrictedAccess ? "Restricted" : "General campus access"],
  ]

  return (
    <article className="space-y-5">
      <header className="space-y-1">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-heading text-xl font-medium">{categoryLabel(restroom.category)} restroom</h2>
          <AccessibilityBadge accessible={restroom.accessible} />
        </div>
        <p className="text-sm text-muted-foreground">{restroom.building.name}</p>
      </header>
      <dl className="space-y-3 text-sm">
        {details.map(([term, description]) => (
          <div key={term} className="flex justify-between gap-6 border-b pb-3 last:border-0">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className="text-right font-medium">{description}</dd>
          </div>
        ))}
      </dl>
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
  const [selectedRestroom, setSelectedRestroom] = useState<Restroom | null>(null)
  const [snapPoint, setSnapPoint] = useState<string | number>(collapsedSnapPoint)
  const [email, setEmail] = useState("x.tao@berkeley.edu")
  const [searchQuery, setSearchQuery] = useState("")
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null)
  const matchingRestrooms = submittedQuery === null ? [] : searchRestrooms(submittedQuery)
  const visibleRestrooms = matchingRestrooms.slice(0, resultLimit)

  function showView(nextView: DrawerView) {
    setView(nextView)
    const hasSavedResults = submittedQuery !== null
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
        <DrawerContent className="mx-auto max-w-xl">
          <DrawerTitle className="sr-only">Campus information</DrawerTitle>
          <DrawerDescription className="sr-only">Search, view, and add campus amenities.</DrawerDescription>
          <div className="drawer-main-content flex-1 overflow-y-auto overscroll-contain p-4">
            <div className="mx-auto max-w-lg">
              {view !== "search" && <Button type="button" variant="outline" className="mb-5" onClick={() => showView("search")}>Back</Button>}
              {view === "search" && (
                <SearchView
                  hasSearched={submittedQuery !== null}
                  query={searchQuery}
                  onQueryChange={setSearchQuery}
                  onSearch={() => {
                    setSubmittedQuery(searchQuery)
                    setSnapPoint(1)
                  }}
                  onSelect={(restroom) => { setSelectedRestroom(restroom); showView("details") }}
                  results={visibleRestrooms}
                  totalResultCount={matchingRestrooms.length}
                />
              )}
              {view === "details" && selectedRestroom && <RestroomDetails restroom={selectedRestroom} />}
              {view === "create" && <CreateAmenityForm />}
              {view === "settings" && <SettingsView email={email} onSave={setEmail} />}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </main>
  )
}
