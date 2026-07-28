import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import {
  ArrowLeftIcon,
  BookOpenIcon,
  DropletsIcon,
  LogInIcon,
  LogOutIcon,
  PlusIcon,
  PopcornIcon,
  SettingsIcon,
  ToiletIcon,
} from "lucide-react"

import { CampusMap } from "@/components/campus-map"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  loadAmenitiesForBuilding,
  loadBuildings,
  searchBuildings,
  type Amenity,
  type AmenityType,
  type Building,
  type BuildingSearchResult,
  type GeneralAmenity,
  type Restroom,
} from "@/data/amenities"
import {
  authenticationErrorMessage,
  observeAuthState,
  signInWithGoogle,
  signOutCurrentUser,
  type AuthUser,
} from "@/lib/auth"

type DrawerView = "search" | "building" | "restroom" | "create" | "settings"

const amenityTypes = ["Restroom", "Water refill station", "Vending machine", "Study space"]
const collapsedSnapPoint = "11rem"
const resultLimit = 50
const amenityTypeOrder: AmenityType[] = ["restroom", "waterRefillStation", "vendingMachine", "studySpace"]

const amenityTypeLabels: Record<AmenityType, { singular: string; plural: string }> = {
  restroom: { singular: "Restroom", plural: "Restrooms" },
  waterRefillStation: { singular: "Water refill station", plural: "Water refill stations" },
  vendingMachine: { singular: "Vending machine", plural: "Vending machines" },
  studySpace: { singular: "Study space", plural: "Study spaces" },
}

const buildingAmenityIcons = [
  { countKey: "restrooms", label: "Restrooms available", Icon: ToiletIcon },
  { countKey: "waterRefillStations", label: "Water refill stations available", Icon: DropletsIcon },
  { countKey: "vendingMachines", label: "Vending machines available", Icon: PopcornIcon },
  { countKey: "studySpaces", label: "Study spaces available", Icon: BookOpenIcon },
] as const

function categoryLabel(category: Restroom["category"]) {
  if (category === "women") return "Women's"
  if (category === "men") return "Men's"
  return "Gender-inclusive"
}

function preferredRestroomCategory(gender: string): Restroom["category"] | null {
  if (gender === "Woman") return "women"
  if (gender === "Man") return "men"
  if (gender === "Non-binary") return "genderInclusive"
  return null
}

function restroomLocationLabel(restroom: Restroom) {
  return [
    restroom.floorNumber ? `Floor ${restroom.floorNumber}` : null,
    restroom.roomNumber ? `Room ${restroom.roomNumber}` : null,
  ].filter(Boolean).join(" · ")
}

function AvailabilityBadge({ isAvailable }: { isAvailable: boolean | null }) {
  if (isAvailable === null) return null

  return (
    <Badge
      variant={isAvailable ? "outline" : "destructive"}
      className={isAvailable ? "border-0 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : undefined}
    >
      {isAvailable ? "Available" : "Out of service"}
    </Badge>
  )
}

function RestroomResult({ restroom, onSelect }: { restroom: Restroom; onSelect: () => void }) {
  const locationLabel = restroomLocationLabel(restroom)

  return (
    <button type="button" className="block w-full rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={onSelect}>
      <div className="flex w-full items-start justify-between gap-4 rounded-xl bg-card p-3 text-sm text-card-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted/50">
        <div className="min-w-0 flex-1">
          <p className="font-heading font-medium leading-snug">{categoryLabel(restroom.category)} restroom</p>
          {locationLabel && <p className="mt-1 text-muted-foreground">{locationLabel}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <AvailabilityBadge isAvailable={restroom.isAvailable} />
          {restroom.stallType && <Badge variant="outline">{restroom.stallType === "single" ? "Single-stall" : "Multi-stall"}</Badge>}
          {restroom.restrictedAccess && <Badge variant="outline">Restricted access</Badge>}
        </div>
      </div>
    </button>
  )
}

function GeneralAmenityResult({ amenity }: { amenity: GeneralAmenity }) {
  const locationLabel = [
    amenity.floorNumber ? `Floor ${amenity.floorNumber}` : null,
    amenity.locationDetails,
  ].filter(Boolean).join(" · ")

  return (
    <article className="flex w-full items-start justify-between gap-4 rounded-xl bg-card p-3 text-sm text-card-foreground ring-1 ring-foreground/10">
      <div className="min-w-0 flex-1">
        <h4 className="font-heading font-medium leading-snug">{amenityTypeLabels[amenity.amenityType].singular}</h4>
        {locationLabel && <p className="mt-1 text-muted-foreground">{locationLabel}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <AvailabilityBadge isAvailable={amenity.isAvailable} />
        {amenity.accessible !== null && <Badge variant="outline">{amenity.accessible ? "Accessible" : "Not accessible"}</Badge>}
      </div>
    </article>
  )
}

function BuildingResult({ result, onSelect }: { result: BuildingSearchResult; onSelect: () => void }) {
  const { building, amenityCounts } = result

  return (
    <button type="button" className="block w-full rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={onSelect}>
      <div className="flex w-full items-center justify-between gap-4 rounded-xl bg-card p-3 text-sm text-card-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted/50">
        <div className="min-w-0 flex-1">
          <p className="font-heading font-medium leading-snug">{building.name}</p>
          {building.shortName && building.shortName !== building.name && <p className="mt-1 text-muted-foreground">{building.shortName}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge variant="secondary">
            {amenityCounts.total.toLocaleString()} {amenityCounts.total === 1 ? "amenity" : "amenities"}
          </Badge>
          {amenityCounts.total > 0 && (
            <div className="flex items-center gap-1" aria-label="Available amenity types">
              {buildingAmenityIcons.map(({ countKey, label, Icon }) => amenityCounts[countKey] > 0 && (
                <span key={countKey} className="grid size-6 place-items-center text-foreground" aria-label={label} title={label}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              ))}
            </div>
          )}
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
  onSelectBuilding,
  results,
  totalResultCount,
}: {
  hasSearched: boolean
  query: string
  onQueryChange: (query: string) => void
  onSearch: () => void
  onSelectBuilding: (building: Building) => void
  results: BuildingSearchResult[]
  totalResultCount: number
}) {
  const isSearchDisabled = query.trim().length === 0

  return (
    <section className="space-y-4" aria-labelledby="search-heading">
      <h2 id="search-heading" className="sr-only">Search campus buildings and amenities</h2>
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (isSearchDisabled) return
          onSearch()
        }}
      >
        <Input
          name="query"
          type="search"
          aria-label="Search buildings and amenities"
          placeholder="Search buildings or amenities"
          className="h-9"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <Button type="submit" disabled={isSearchDisabled}>Search</Button>
      </form>

      <Separator />

      <section className="space-y-3" aria-labelledby="buildings-heading" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <h2 id="buildings-heading" className="text-sm font-medium">Campus Buildings</h2>
          {hasSearched && totalResultCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Showing {results.length.toLocaleString()} of {totalResultCount.toLocaleString()} results.
            </p>
          )}
        </div>
        {!hasSearched && <p className="text-sm text-muted-foreground">Search by building or amenity type.</p>}
        {hasSearched && totalResultCount === 0 && <p className="text-sm text-muted-foreground">No matching buildings found.</p>}
        {results.length > 0 && (
          <div className="flex flex-col gap-3">
            {results.map((result) => (
              <BuildingResult key={result.building.id} result={result} onSelect={() => onSelectBuilding(result.building)} />
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

function BuildingDetails({
  building,
  amenities,
  preferredCategory,
  onSelectRestroom,
}: {
  building: Building
  amenities: Amenity[]
  preferredCategory: Restroom["category"] | null
  onSelectRestroom: (restroom: Restroom) => void
}) {
  const amenitiesByType = new Map<AmenityType, Amenity[]>()
  amenities.forEach((amenity) => {
    const groupedAmenities = amenitiesByType.get(amenity.amenityType) ?? []
    groupedAmenities.push(amenity)
    amenitiesByType.set(amenity.amenityType, groupedAmenities)
  })

  const restrooms = amenitiesByType.get("restroom") as Restroom[] | undefined
  restrooms?.sort((first, second) => (
    Number(second.category === preferredCategory) - Number(first.category === preferredCategory)
  ))

  return (
    <article className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-medium">{building.name}</h2>
        <p className="text-sm text-muted-foreground">
          {amenities.length.toLocaleString()} total {amenities.length === 1 ? "amenity" : "amenities"}
        </p>
      </header>

      {amenities.length === 0 && <p className="text-sm text-muted-foreground">No amenities have been recorded for this building.</p>}

      {amenityTypeOrder.map((amenityType) => {
        const groupedAmenities = amenitiesByType.get(amenityType)
        if (!groupedAmenities?.length) return null

        return (
          <section key={amenityType} className="flex flex-col gap-3" aria-labelledby={`${amenityType}-heading`}>
            <h3 id={`${amenityType}-heading`} className="text-sm font-medium">
              {groupedAmenities.length.toLocaleString()} {amenityTypeLabels[amenityType][groupedAmenities.length === 1 ? "singular" : "plural"]}
            </h3>
            <div className="flex flex-col gap-3">
              {groupedAmenities.map((amenity) => amenity.amenityType === "restroom" ? (
                <RestroomResult key={amenity.id} restroom={amenity} onSelect={() => onSelectRestroom(amenity)} />
              ) : (
                <GeneralAmenityResult key={amenity.id} amenity={amenity} />
              ))}
            </div>
          </section>
        )
      })}
    </article>
  )
}

function RestroomDetails({ restroom }: { restroom: Restroom }) {
  const details = [
    ...(restroom.floorNumber ? [["Floor", restroom.floorNumber]] : []),
    ...(restroom.roomNumber ? [["Room number", restroom.roomNumber]] : []),
    ["Accessibility", restroom.accessible ? "Accessible" : "Not accessible"],
    ...(restroom.stallType ? [["Stall type", `${restroom.stallType === "single" ? "Single" : "Multi"}-stall`]] : []),
    ["Access", restroom.restrictedAccess ? "Restricted" : "General campus access"],
  ]

  return (
    <article className="space-y-5">
      <header className="space-y-1">
        <h2 className="font-heading text-xl font-medium">{categoryLabel(restroom.category)} restroom</h2>
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

function CreateAmenityForm({ buildings }: { buildings: Building[] }) {
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

function userInitials(user: AuthUser) {
  const nameInitials = user.displayName?.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2)
  return nameInitials?.toLocaleUpperCase() || user.email?.[0]?.toLocaleUpperCase() || "U"
}

function SettingsView({
  authError,
  authUser,
  gender,
  isAuthLoading,
  isAuthPending,
  onSave,
  onSignIn,
  onSignOut,
}: {
  authError: string
  authUser: AuthUser | null
  gender: string
  isAuthLoading: boolean
  isAuthPending: boolean
  onSave: (gender: string) => void
  onSignIn: () => void
  onSignOut: () => void
}) {
  const [draftGender, setDraftGender] = useState(gender)
  const [success, setSuccess] = useState(false)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const hasChanges = draftGender !== gender

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!hasChanges) return

    onSave(draftGender)
    setSuccess(true)
    requestAnimationFrame(() => statusRef.current?.focus())
  }

  return (
    <section aria-labelledby="settings-heading">
      <h2 id="settings-heading" className="font-heading text-xl font-medium">Settings</h2>

      <div className="mt-5 flex flex-col gap-3">
        {isAuthLoading ? (
          <p role="status" className="text-sm text-muted-foreground">Checking sign-in...</p>
        ) : authUser ? (
          <div className="flex items-center gap-3">
            <Avatar>
              {authUser.photoURL && <AvatarImage src={authUser.photoURL} alt="" referrerPolicy="no-referrer" />}
              <AvatarFallback>{userInitials(authUser)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{authUser.displayName ?? "Google user"}</p>
              {authUser.email && <p className="truncate text-xs text-muted-foreground">{authUser.email}</p>}
            </div>
            <Button type="button" variant="outline" disabled={isAuthPending} onClick={onSignOut}>
              <LogOutIcon data-icon="inline-start" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">Sign in securely through Google.</p>
            <Button type="button" disabled={isAuthPending} onClick={onSignIn}>
              <LogInIcon data-icon="inline-start" aria-hidden="true" />
              {isAuthPending ? "Signing in..." : "Sign in with Google"}
            </Button>
          </div>
        )}
        {authError && <p role="alert" className="text-sm text-destructive">{authError}</p>}
      </div>

      <Separator className="mt-5" />

      <form className="mt-5 space-y-4" onSubmit={saveSettings}>
        <FormSelect
          id="settings-gender"
          label="Gender"
          placeholder="Select gender"
          options={["Woman", "Man", "Non-binary", "Prefer not to say"]}
          value={draftGender}
          onValueChange={(value) => {
            setDraftGender(value)
            setSuccess(false)
          }}
        />
        <Button type="submit" disabled={!hasChanges}>Save preferences</Button>
      </form>
      {success && (
        <p ref={statusRef} role="status" tabIndex={-1} className="mt-4 rounded-lg bg-secondary p-3 text-sm font-medium">
          Settings saved for this session.
        </p>
      )}
    </section>
  )
}

export function App() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [buildingLoadError, setBuildingLoadError] = useState("")
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [view, setView] = useState<DrawerView>("search")
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [selectedRestroom, setSelectedRestroom] = useState<Restroom | null>(null)
  const [selectedAmenities, setSelectedAmenities] = useState<Amenity[]>([])
  const [amenityLoadError, setAmenityLoadError] = useState("")
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(false)
  const [snapPoint, setSnapPoint] = useState<string | number>(collapsedSnapPoint)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authError, setAuthError] = useState("")
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAuthPending, setIsAuthPending] = useState(false)
  const [gender, setGender] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null)
  const amenityCache = useRef(new Map<number, Amenity[]>())
  const amenityRequest = useRef(0)
  const preferredCategory = preferredRestroomCategory(gender)
  const matchingBuildings = submittedQuery === null ? [] : searchBuildings(buildings, submittedQuery)
  const visibleBuildings = matchingBuildings.slice(0, resultLimit)

  useEffect(() => {
    let cancelled = false
    setIsLoadingBuildings(true)
    setBuildingLoadError("")

    loadBuildings()
      .then((loadedBuildings) => {
        if (!cancelled) setBuildings(loadedBuildings)
      })
      .catch((error: unknown) => {
        if (!cancelled) setBuildingLoadError(error instanceof Error ? error.message : "Unable to load campus data.")
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBuildings(false)
      })

    return () => {
      cancelled = true
    }
  }, [loadAttempt])

  useEffect(() => observeAuthState(
    (user) => {
      setAuthUser(user)
      setIsAuthLoading(false)
    },
    () => {
      setAuthError("Authentication could not be initialized. Check the Firebase configuration and try again.")
      setIsAuthLoading(false)
    },
  ), [])

  async function signIn() {
    setAuthError("")
    setIsAuthPending(true)
    try {
      setAuthUser(await signInWithGoogle())
    } catch (error) {
      const message = authenticationErrorMessage(error)
      if (message) {
        setAuthError(message)
        showView("settings")
      }
    } finally {
      setIsAuthPending(false)
    }
  }

  async function signOutUser() {
    setAuthError("")
    setIsAuthPending(true)
    try {
      await signOutCurrentUser()
      setAuthUser(null)
    } catch {
      setAuthError("Sign out could not be completed. Please try again.")
    } finally {
      setIsAuthPending(false)
    }
  }

  function showView(nextView: DrawerView) {
    setView(nextView)
    const hasSavedResults = submittedQuery !== null
    setSnapPoint(nextView === "search" && !hasSavedResults ? collapsedSnapPoint : 1)
  }

  function submitSearch(query: string) {
    setSearchQuery(query)
    setSubmittedQuery(query)
    setSelectedBuilding(null)
    setSelectedRestroom(null)
    setView("search")
    setSnapPoint(1)
  }

  async function openBuilding(building: Building) {
    const request = ++amenityRequest.current
    setSelectedBuilding(building)
    setSelectedRestroom(null)
    setAmenityLoadError("")
    showView("building")

    const cachedAmenities = amenityCache.current.get(building.id)
    if (cachedAmenities) {
      setSelectedAmenities(cachedAmenities)
      setIsLoadingAmenities(false)
      return
    }

    setSelectedAmenities([])
    setIsLoadingAmenities(true)

    try {
      const loadedAmenities = await loadAmenitiesForBuilding(building)
      amenityCache.current.set(building.id, loadedAmenities)
      if (request === amenityRequest.current) setSelectedAmenities(loadedAmenities)
    } catch (error) {
      if (request === amenityRequest.current) {
        setAmenityLoadError(error instanceof Error ? error.message : "Unable to load amenities.")
      }
    } finally {
      if (request === amenityRequest.current) setIsLoadingAmenities(false)
    }
  }

  function goBack() {
    if (view === "restroom") {
      showView("building")
      return
    }
    showView("search")
  }

  return (
    <main className="app-shell">
      <h1 className="sr-only">UC Berkeley Campus Amenities</h1>
      <CampusMap buildings={buildings} onBuildingSelect={openBuilding} />

      <nav className="top-actions" aria-label="App actions">
        <Button type="button" className="bg-accent text-[var(--berkeley-blue-dark)] hover:bg-accent/80" onClick={() => showView("create")}>
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          Add Amenity
        </Button>
        <Button type="button" onClick={() => showView("settings")}>
          <SettingsIcon data-icon="inline-start" aria-hidden="true" />
          Settings
        </Button>
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
              {view !== "search" && (
                <Button type="button" variant="outline" className="mb-5" onClick={goBack}>
                  <ArrowLeftIcon aria-hidden="true" />
                  Back
                </Button>
              )}
              {view === "search" && (
                isLoadingBuildings ? (
                  <p role="status" className="text-sm text-muted-foreground">Loading campus data...</p>
                ) : buildingLoadError ? (
                  <div role="alert" className="space-y-3 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                    <p>Campus data could not be loaded. {buildingLoadError}</p>
                    <Button type="button" variant="outline" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Try again</Button>
                  </div>
                ) : (
                  <SearchView
                    hasSearched={submittedQuery !== null}
                    query={searchQuery}
                    onQueryChange={setSearchQuery}
                    onSearch={() => submitSearch(searchQuery)}
                    onSelectBuilding={openBuilding}
                    results={visibleBuildings}
                    totalResultCount={matchingBuildings.length}
                  />
                )
              )}
              {view === "building" && selectedBuilding && (
                isLoadingAmenities ? (
                  <p role="status" className="text-sm text-muted-foreground">Loading amenities for {selectedBuilding.name}...</p>
                ) : amenityLoadError ? (
                  <div role="alert" className="space-y-3 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                    <p>Amenities could not be loaded. {amenityLoadError}</p>
                    <Button type="button" variant="outline" onClick={() => void openBuilding(selectedBuilding)}>Try again</Button>
                  </div>
                ) : (
                  <BuildingDetails
                    building={selectedBuilding}
                    amenities={[...selectedAmenities]}
                    preferredCategory={preferredCategory}
                    onSelectRestroom={(restroom) => {
                      setSelectedRestroom(restroom)
                      showView("restroom")
                    }}
                  />
                )
              )}
              {view === "restroom" && selectedRestroom && <RestroomDetails restroom={selectedRestroom} />}
              {view === "create" && <CreateAmenityForm buildings={buildings} />}
              {view === "settings" && (
                <SettingsView
                  authError={authError}
                  authUser={authUser}
                  gender={gender}
                  isAuthLoading={isAuthLoading}
                  isAuthPending={isAuthPending}
                  onSave={setGender}
                  onSignIn={() => void signIn()}
                  onSignOut={() => void signOutUser()}
                />
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </main>
  )
}
