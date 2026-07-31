import { useEffect, useRef, useState } from "react"

import { AppActions } from "@/components/app-actions"
import { CampusDrawer, collapsedSnapPoint } from "@/components/campus-drawer"
import { CampusMap } from "@/components/campus-map"
import { Button } from "@/components/ui/button"
import {
  loadAmenitiesForBuilding,
  loadBuildings,
  type Amenity,
  type Building,
  type Restroom,
} from "@/data/amenities"
import {
  authenticationErrorMessage,
  observeAuthState,
  signInWithGoogle,
  signOutCurrentUser,
  type AuthUser,
} from "@/lib/auth"
import type { Coordinates } from "@/lib/geo"
import { AmenityDetailsPage } from "@/pages/amenity-details/amenity-details-page"
import { BuildingPage } from "@/pages/building/building-page"
import { CreateAmenityPage } from "@/pages/create-amenity/create-amenity-page"
import { SearchPage } from "@/pages/search/search-page"
import { SettingsPage } from "@/pages/settings/settings-page"

type DrawerView = "search" | "building" | "amenityDetails" | "create" | "settings"

function preferredRestroomCategory(gender: string): Restroom["category"] | null {
  if (gender === "Woman") return "women"
  if (gender === "Man") return "men"
  if (gender === "Non-binary") return "genderInclusive"
  return null
}

export function App() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [buildingLoadError, setBuildingLoadError] = useState("")
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [view, setView] = useState<DrawerView>("search")
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [selectedAmenity, setSelectedAmenity] = useState<Restroom | null>(null)
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
  const [userPosition, setUserPosition] = useState<Coordinates | null>(null)
  const [routeOrigin, setRouteOrigin] = useState<Coordinates | null>(null)
  const amenityCache = useRef(new Map<number, Amenity[]>())
  const amenityRequest = useRef(0)
  const preferredCategory = preferredRestroomCategory(gender)

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

  useEffect(() => {
    if ((view === "building" || view === "amenityDetails") && selectedBuilding && !routeOrigin && userPosition) {
      setRouteOrigin(userPosition)
    }
  }, [routeOrigin, selectedBuilding, userPosition, view])

  function showView(nextView: DrawerView) {
    setView(nextView)
    const hasSavedResults = submittedQuery !== null
    setSnapPoint(nextView === "search" && !hasSavedResults ? collapsedSnapPoint : 1)
  }

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

  function submitSearch() {
    setSubmittedQuery(searchQuery)
    setSelectedBuilding(null)
    setSelectedAmenity(null)
    setRouteOrigin(null)
    setView("search")
    setSnapPoint(1)
  }

  async function openBuilding(building: Building) {
    const request = ++amenityRequest.current
    setSelectedBuilding(building)
    setSelectedAmenity(null)
    setRouteOrigin(userPosition)
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
    if (view === "amenityDetails") {
      showView("building")
      return
    }
    setRouteOrigin(null)
    showView("search")
  }

  return (
    <main className="app-shell">
      <h1 className="sr-only">UC Berkeley Campus Amenities</h1>
      <CampusMap
        buildings={buildings}
        onBuildingSelect={openBuilding}
        onLocationChange={setUserPosition}
        routeDestination={view === "building" || view === "amenityDetails" ? selectedBuilding : null}
        routeOrigin={routeOrigin}
      />

      <AppActions onCreate={() => showView("create")} onOpenSettings={() => showView("settings")} />

      <CampusDrawer
        snapPoint={snapPoint}
        onSnapPointChange={setSnapPoint}
        showBack={view !== "search" && snapPoint === 1}
        onBack={goBack}
      >
        {view === "search" && (
          isLoadingBuildings ? (
            <p role="status" className="text-sm text-muted-foreground">Loading campus data...</p>
          ) : buildingLoadError ? (
            <div role="alert" className="space-y-3 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
              <p>Campus data could not be loaded. {buildingLoadError}</p>
              <Button type="button" variant="outline" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Try again</Button>
            </div>
          ) : (
            <SearchPage
              buildings={buildings}
              query={searchQuery}
              submittedQuery={submittedQuery}
              onQueryChange={setSearchQuery}
              onSearch={submitSearch}
              onSelectBuilding={openBuilding}
              position={userPosition}
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
            <BuildingPage
              building={selectedBuilding}
              amenities={[...selectedAmenities]}
              position={userPosition}
              preferredCategory={preferredCategory}
              onSelectAmenity={(amenity) => {
                setSelectedAmenity(amenity)
                showView("amenityDetails")
              }}
            />
          )
        )}
        {view === "amenityDetails" && selectedAmenity && (
          <AmenityDetailsPage
            isDrawerExpanded={snapPoint === 1}
            onToggleDrawer={() => setSnapPoint(snapPoint === 1 ? collapsedSnapPoint : 1)}
            amenity={selectedAmenity}
          />
        )}
        {view === "create" && <CreateAmenityPage buildings={buildings} />}
        {view === "settings" && (
          <SettingsPage
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
      </CampusDrawer>
    </main>
  )
}
