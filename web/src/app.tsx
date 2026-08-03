import { useEffect, useState } from "react"

import { AppActions } from "@/components/app-actions"
import { CampusDrawer, collapsedSnapPoint } from "@/components/campus-drawer"
import { CampusMap } from "@/components/campus-map"
import { Button } from "@/components/ui/button"
import type { Amenity, Building, Restroom } from "@/data/amenities"
import {
  loadUserPreferences,
  saveUserPreferences,
  type GenderPreference,
} from "@/data/user-preferences"
import { useAuthSession } from "@/hooks/use-auth-session"
import { useBuildingAmenities } from "@/hooks/use-building-amenities"
import { useBuildings } from "@/hooks/use-buildings"
import type { Coordinates } from "@/lib/geo"
import { AmenityDetailsPage } from "@/pages/amenity-details/amenity-details-page"
import { BuildingPage } from "@/pages/building/building-page"
import { CreateAmenityPage } from "@/pages/create-amenity/create-amenity-page"
import { SearchPage } from "@/pages/search/search-page"
import { SettingsPage } from "@/pages/settings/settings-page"

type DrawerView = "search" | "building" | "amenityDetails" | "create" | "settings"

function preferredRestroomCategory(gender: GenderPreference | ""): Restroom["category"] | null {
  if (gender === "Woman") return "women"
  if (gender === "Man") return "men"
  if (gender === "Non-binary") return "genderInclusive"
  return null
}

export function App() {
  const {
    buildings,
    error: buildingLoadError,
    retry: retryBuildings,
    status: buildingsStatus,
  } = useBuildings()
  const [view, setView] = useState<DrawerView>("search")
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null)
  const {
    amenities: selectedAmenities,
    error: amenityLoadError,
    retry: retryAmenities,
    status: amenitiesStatus,
  } = useBuildingAmenities(selectedBuilding)
  const [snapPoint, setSnapPoint] = useState<string | number>(collapsedSnapPoint)
  const {
    error: authError,
    isInitializing: isAuthLoading,
    isPending: isAuthPending,
    signIn,
    signOut: signOutUser,
    user: authUser,
  } = useAuthSession()
  const [gender, setGender] = useState<GenderPreference | "">("")
  const [isPreferenceLoading, setIsPreferenceLoading] = useState(false)
  const [preferenceError, setPreferenceError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null)
  const [userPosition, setUserPosition] = useState<Coordinates | null>(null)
  const [routeOrigin, setRouteOrigin] = useState<Coordinates | null>(null)
  const preferredCategory = preferredRestroomCategory(gender)

  useEffect(() => {
    if ((view === "building" || view === "amenityDetails") && selectedBuilding && !routeOrigin && userPosition) {
      setRouteOrigin(userPosition)
    }
  }, [routeOrigin, selectedBuilding, userPosition, view])

  useEffect(() => {
    if (!authUser) {
      setIsPreferenceLoading(false)
      setPreferenceError("")
      return
    }

    let cancelled = false
    setIsPreferenceLoading(true)
    setPreferenceError("")
    loadUserPreferences(authUser.uid)
      .then((preferences) => {
        if (!cancelled) setGender(preferences?.gender ?? "")
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setPreferenceError(error instanceof Error ? error.message : "Preferences could not be loaded.")
        }
      })
      .finally(() => {
        if (!cancelled) setIsPreferenceLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authUser])

  function showView(nextView: DrawerView) {
    setView(nextView)
    const hasSavedResults = submittedQuery !== null
    setSnapPoint(nextView === "search" && !hasSavedResults ? collapsedSnapPoint : 1)
  }

  async function signInUser() {
    const error = await signIn()
    if (error) showView("settings")
  }

  async function savePreferences(nextGender: GenderPreference) {
    setPreferenceError("")
    if (authUser) await saveUserPreferences(authUser.uid, { gender: nextGender })
    setGender(nextGender)
  }

  function submitSearch() {
    setSubmittedQuery(searchQuery)
    setSelectedBuilding(null)
    setSelectedAmenity(null)
    setRouteOrigin(null)
    setView("search")
    setSnapPoint(1)
  }

  function openBuilding(building: Building) {
    setSelectedBuilding(building)
    setSelectedAmenity(null)
    setRouteOrigin(userPosition)
    showView("building")
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
          buildingsStatus === "loading" ? (
            <p role="status" className="text-sm text-muted-foreground">Loading campus data...</p>
          ) : buildingLoadError ? (
            <div role="alert" className="space-y-3 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
              <p>Campus data could not be loaded. {buildingLoadError}</p>
              <Button type="button" variant="outline" onClick={retryBuildings}>Try again</Button>
            </div>
          ) : (
            <SearchPage
              buildings={buildings}
              isDrawerExpanded={snapPoint === 1}
              query={searchQuery}
              submittedQuery={submittedQuery}
              onQueryChange={setSearchQuery}
              onSearch={submitSearch}
              onSelectBuilding={openBuilding}
              onToggleDrawer={() => setSnapPoint(snapPoint === 1 ? collapsedSnapPoint : 1)}
              position={userPosition}
              preferredCategory={preferredCategory}
            />
          )
        )}
        {view === "building" && selectedBuilding && (
          amenitiesStatus === "loading" ? (
            <p role="status" className="text-sm text-muted-foreground">Loading amenities for {selectedBuilding.name}...</p>
          ) : amenityLoadError ? (
            <div role="alert" className="space-y-3 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
              <p>Amenities could not be loaded. {amenityLoadError}</p>
              <Button type="button" variant="outline" onClick={retryAmenities}>Try again</Button>
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
            authUser={authUser}
            isAuthLoading={isAuthLoading}
            isAuthPending={isAuthPending}
            onSignIn={() => void signInUser()}
          />
        )}
        {view === "create" && (
          <CreateAmenityPage
            buildings={buildings}
            authUser={authUser}
            isAuthLoading={isAuthLoading}
            isAuthPending={isAuthPending}
            onSignIn={() => void signInUser()}
          />
        )}
        {view === "settings" && (
          <SettingsPage
            authError={authError}
            authUser={authUser}
            gender={gender}
            isAuthLoading={isAuthLoading}
            isAuthPending={isAuthPending}
            isPreferenceLoading={isPreferenceLoading}
            preferenceError={preferenceError}
            onSave={savePreferences}
            onSignIn={() => void signInUser()}
            onSignOut={() => void signOutUser()}
          />
        )}
      </CampusDrawer>
    </main>
  )
}
