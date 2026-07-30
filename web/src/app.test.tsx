import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { App } from "@/app"
import { loadAmenitiesForBuilding, loadBuildings, searchBuildings } from "@/data/amenities"
import {
  authenticationErrorMessage,
  observeAuthState,
  signInWithGoogle,
  signOutCurrentUser,
  type AuthUser,
} from "@/lib/auth"
import { amenities, buildings, restrooms } from "@/test/amenity-fixtures"

vi.mock("@/data/amenities", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/data/amenities")>(),
  loadBuildings: vi.fn(),
  loadAmenitiesForBuilding: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  authenticationErrorMessage: vi.fn(() => "Google sign-in could not be completed. Please try again."),
  observeAuthState: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOutCurrentUser: vi.fn(),
}))

const signedInUser: AuthUser = {
  uid: "google-user-1",
  displayName: "Test User",
  email: "test.user@example.com",
  photoURL: "https://example.com/avatar.jpg",
}

async function renderApp() {
  const result = render(<App />)
  await screen.findByRole("searchbox")
  return result
}

function installGoogleMapsMock() {
  const maps: Array<{
    options: google.maps.MapOptions
    data: {
      addGeoJson: ReturnType<typeof vi.fn>
      remove: ReturnType<typeof vi.fn>
      setStyle: ReturnType<typeof vi.fn>
    }
    fitBounds: ReturnType<typeof vi.fn>
    fitBoundsZoom: number | undefined
    panBy: ReturnType<typeof vi.fn>
    panTo: ReturnType<typeof vi.fn>
    setZoom: ReturnType<typeof vi.fn>
    startDrag: () => void
    zoom: number
  }> = []
  const markers: Array<{
    map: unknown
    options: google.maps.marker.AdvancedMarkerElementOptions
    position: google.maps.marker.AdvancedMarkerElement["position"]
    click: () => void
    removeEventListener: ReturnType<typeof vi.fn>
  }> = []
  const circles: Array<{
    options: google.maps.CircleOptions
    center: google.maps.LatLng | google.maps.LatLngLiteral | null | undefined
    radius: number
    map: google.maps.Map | null | undefined
    setMap: ReturnType<typeof vi.fn>
  }> = []
  const polylines: Array<{
    map: google.maps.Map | null
    options: google.maps.routes.RoutePolylineOptions | undefined
    setMap: ReturnType<typeof vi.fn>
  }> = []
  const polygonFeatures = [{ id: "campus-buildings" }]
  const routeViewport = { id: "route-viewport" } as unknown as google.maps.LatLngBounds
  const computeRoutes = vi.fn(async (_request: google.maps.routes.ComputeRoutesRequest) => ({
    fallbackInfo: null,
    geocodingResults: null,
    routes: [{
      createPolylines: (options?: google.maps.routes.RoutePolylineOptions) => {
        const polyline = {
          map: null as google.maps.Map | null,
          options,
          setMap: vi.fn((map: google.maps.Map | null) => {
            polyline.map = map
          }),
        }
        polylines.push(polyline)
        return [polyline]
      },
      viewport: routeViewport,
    }],
  }))

  class MockMap {
    options: google.maps.MapOptions
    data = {
      addGeoJson: vi.fn(() => polygonFeatures),
      remove: vi.fn(),
      setStyle: vi.fn(),
    }
    fitBoundsZoom: number | undefined
    idle = () => {}
    fitBounds = vi.fn(() => {
      if (this.fitBoundsZoom !== undefined) {
        this.zoom = Math.min(this.fitBoundsZoom, this.options.maxZoom ?? Number.POSITIVE_INFINITY)
      }
      this.idle()
    })
    panBy = vi.fn()
    panTo = vi.fn()
    zoom = 16
    zoomChanged = () => {}
    dragStarted = () => {}

    constructor(_element: HTMLElement, options: google.maps.MapOptions) {
      this.options = options
      maps.push(this)
    }

    addListener(eventName: string, handler: () => void) {
      if (eventName === "zoom_changed") this.zoomChanged = handler
      if (eventName === "dragstart") this.dragStarted = handler
      if (eventName === "idle") this.idle = handler
      return {
        remove: vi.fn(() => {
          if (eventName === "idle" && this.idle === handler) this.idle = () => {}
        }),
      }
    }

    getZoom() {
      return this.zoom
    }

    setZoom = vi.fn((zoom: number) => {
      this.zoom = zoom
      this.zoomChanged()
    })

    startDrag() {
      this.dragStarted()
    }
  }

  class MockAdvancedMarkerElement {
    map: unknown
    options: google.maps.marker.AdvancedMarkerElementOptions
    position: google.maps.marker.AdvancedMarkerElement["position"]
    click = () => {}
    removeEventListener = vi.fn()

    constructor(options: google.maps.marker.AdvancedMarkerElementOptions) {
      this.options = options
      this.map = options.map ?? null
      this.position = options.position ?? null
      markers.push(this)
    }

    addEventListener(eventName: string, handler: () => void) {
      if (eventName === "gmp-click") this.click = handler
    }
  }

  class MockCircle {
    options: google.maps.CircleOptions
    center: google.maps.LatLng | google.maps.LatLngLiteral | null | undefined
    radius: number
    map: google.maps.Map | null | undefined
    setMap = vi.fn((map: google.maps.Map | null) => {
      this.map = map
    })

    constructor(options: google.maps.CircleOptions) {
      this.options = options
      this.center = options.center
      this.radius = options.radius ?? 0
      this.map = options.map
      circles.push(this)
    }

    setCenter(center: google.maps.LatLng | google.maps.LatLngLiteral | null) {
      this.center = center
    }

    setRadius(radius: number) {
      this.radius = radius
    }
  }

  const CollisionBehavior = {
    OPTIONAL_AND_HIDES_LOWER_PRIORITY: "OPTIONAL_AND_HIDES_LOWER_PRIORITY",
    REQUIRED: "REQUIRED",
  }

  vi.stubGlobal("google", {
    maps: {
      Map: MockMap,
      Circle: MockCircle,
      importLibrary: vi.fn(async (libraryName: string) => libraryName === "routes" ? {
        Route: { computeRoutes },
      } : {
        AdvancedMarkerElement: MockAdvancedMarkerElement,
        CollisionBehavior,
      }),
    },
  })

  return { circles, computeRoutes, maps, markers, polygonFeatures, polylines, routeViewport }
}

describe("campus map app", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "")
    vi.stubEnv("VITE_GOOGLE_MAPS_MAP_ID", "test-map-id")
    vi.mocked(loadBuildings).mockResolvedValue(buildings)
    vi.mocked(loadAmenitiesForBuilding).mockImplementation(async (building) => (
      amenities.filter((amenity) => amenity.buildingId === building.id)
    ))
    vi.mocked(observeAuthState).mockImplementation((onChange) => {
      onChange(null)
      return vi.fn()
    })
    vi.mocked(signInWithGoogle).mockResolvedValue(signedInUser)
    vi.mocked(signOutCurrentUser).mockResolvedValue()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("shows the map fallback when an API key is not configured", async () => {
    await renderApp()

    expect(screen.getByText("Google Maps is not configured.")).toBeInTheDocument()
  })

  it("shows the map fallback when a map ID is not configured", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key")
    vi.stubEnv("VITE_GOOGLE_MAPS_MAP_ID", "")
    await renderApp()

    expect(screen.getByText("Google Maps is not configured.")).toBeInTheDocument()
  })

  it("shows a database error and retries the initial load", async () => {
    const user = userEvent.setup()
    vi.mocked(loadBuildings).mockRejectedValueOnce(new Error("Database unavailable"))
    render(<App />)

    expect(await screen.findByRole("alert")).toHaveTextContent("Campus data could not be loaded. Database unavailable")
    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByRole("searchbox")).toBeInTheDocument()
    expect(loadBuildings).toHaveBeenCalledTimes(2)
  })

  it("returns individual amenity counts with each building search result", () => {
    const [result] = searchBuildings(buildings, "Cory Hall")

    expect(result).toMatchObject({
      building: { name: "Cory Hall" },
      amenityCounts: {
        total: 14,
        restroom: 10,
        waterRefillStation: 1,
        vendingMachine: 0,
        studySpace: 0,
        lactationRoom: 0,
        microwave: 1,
        zeroWasteStation: 1,
        eatery: 1,
        campusGarden: 0,
        basicNeedService: 0,
        changingTable: 0,
        menstrualProduct: 0,
      },
    })
  })

  it("disables search until the query contains text", async () => {
    const user = userEvent.setup()
    await renderApp()
    const searchbox = screen.getByRole("searchbox")
    const searchButton = screen.getByRole("button", { name: "Search" })

    expect(searchButton).toBeDisabled()

    await user.type(searchbox, "   ")
    expect(searchButton).toBeDisabled()

    await user.type(searchbox, "Cory Hall")
    expect(searchButton).toBeEnabled()

    await user.clear(searchbox)
    expect(searchButton).toBeDisabled()
  })

  it("shows icons for the amenity types available in a building", async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.type(screen.getByRole("searchbox"), "Cory Hall")
    await user.click(screen.getByRole("button", { name: "Search" }))

    const coryResult = screen.getByRole("button", { name: /Cory Hall.*14 amenities/i })
    expect(within(coryResult).queryByText(/\d+(?:\.\d+)? mi/)).not.toBeInTheDocument()
    expect(within(coryResult).getByLabelText("Restrooms available")).toBeInTheDocument()
    expect(within(coryResult).getByLabelText("Water refill stations available")).toBeInTheDocument()
    expect(within(coryResult).getByLabelText("Microwaves available")).toBeInTheDocument()
    expect(within(coryResult).getByLabelText("Zero-waste stations available")).toBeInTheDocument()
    expect(within(coryResult).getByLabelText("Eateries available")).toBeInTheDocument()
    expect(within(coryResult).queryByLabelText("Vending machines available")).not.toBeInTheDocument()
    expect(within(coryResult).queryByLabelText("Study spaces available")).not.toBeInTheDocument()
    expect(within(coryResult).queryByLabelText("Lactation rooms available")).not.toBeInTheDocument()
    expect(within(coryResult).queryByLabelText("Campus gardens available")).not.toBeInTheDocument()
    expect(within(coryResult).queryByLabelText("Basic needs services available")).not.toBeInTheDocument()
    expect(within(coryResult).queryByLabelText("Changing tables available")).not.toBeInTheDocument()
    expect(within(coryResult).queryByLabelText("Menstrual product dispensers available")).not.toBeInTheDocument()
  })

  it("searches buildings case-insensitively and navigates through their amenities", async () => {
    const user = userEvent.setup()
    await renderApp()
    const drawer = document.querySelector('[data-slot="drawer-popup"]')

    expect(drawer).not.toHaveAttribute("data-expanded")

    await user.type(screen.getByRole("searchbox"), "cOrY ReStRoOm")
    await user.click(screen.getByRole("button", { name: "Search" }))

    expect(drawer).toHaveAttribute("data-expanded", "")
    expect(screen.getByText("Showing 1 of 1 results.")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Cory Hall.*14 amenities/i }))

    expect(screen.getByRole("heading", { name: "Cory Hall" })).toBeInTheDocument()
    expect(screen.queryByText("14 total amenities")).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "10 Restrooms" })).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /^(?:Women's|Men's|Gender-inclusive) restroom/i })).toHaveLength(10)

    await user.click(screen.getByRole("button", { name: /Women's restroom.*Floor 1.*Room 112/i }))

    expect(screen.getByRole("heading", { name: "Women's restroom" })).toBeInTheDocument()
    expect(screen.getByText("Cory Hall")).toBeInTheDocument()
    expect(screen.getByText("Room number")).toBeInTheDocument()
    expect(screen.getByText("112")).toBeInTheDocument()
    expect(screen.getByText("Floor")).toBeInTheDocument()
    expect(screen.getByText("Accessibility")).toBeInTheDocument()
    expect(screen.getByText("Accessible")).toBeInTheDocument()
    expect(screen.getByText("General campus access")).toBeInTheDocument()
    expect(screen.queryByText("Stall type")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByRole("heading", { name: "Cory Hall" })).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /^(?:Women's|Men's|Gender-inclusive) restroom/i })).toHaveLength(10)

    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(drawer).toHaveAttribute("data-expanded", "")
    expect(screen.getByRole("searchbox")).toHaveValue("cOrY ReStRoOm")
    expect(screen.getByRole("button", { name: /Cory Hall.*14 amenities/i })).toBeInTheDocument()
  })

  it("searches short building names and returns each eligible building once", async () => {
    const user = userEvent.setup()
    await renderApp()
    const searchbox = screen.getByRole("searchbox")
    const eligibleBuildingCount = new Set(restrooms.map((restroom) => restroom.buildingId)).size

    await user.type(searchbox, "MLK bathroom")
    await user.click(screen.getByRole("button", { name: "Search" }))
    expect(screen.getByRole("button", { name: /Martin Luther King Junior Student Union.*MLK Student Union/i })).toBeInTheDocument()

    await user.clear(searchbox)
    await user.type(searchbox, "bathroom")
    await user.click(screen.getByRole("button", { name: "Search" }))

    expect(screen.getByText(`Showing ${Math.min(50, eligibleBuildingCount)} of ${eligibleBuildingCount} results.`)).toBeInTheDocument()
    const buildingResults = screen.getByRole("region", { name: "Campus Buildings" })
    expect(within(buildingResults).getAllByRole("button", { name: /amenit(?:y|ies)/i })).toHaveLength(Math.min(50, eligibleBuildingCount))
  })

  it("falls back to the full building name when a short name is unavailable", async () => {
    const user = userEvent.setup()
    const coryBuilding = buildings.find((building) => building.name === "Cory Hall")
    const originalShortName = coryBuilding?.shortName

    expect(coryBuilding).toBeDefined()

    try {
      coryBuilding!.shortName = null
      await renderApp()

      await user.type(screen.getByRole("searchbox"), "Cory Hall")
      await user.click(screen.getByRole("button", { name: "Search" }))

      expect(screen.getByRole("button", { name: /Cory Hall.*14 amenities/i })).toBeInTheDocument()
    } finally {
      coryBuilding!.shortName = originalShortName ?? null
    }
  })

  it("only shows availability badges on amenity results", async () => {
    const user = userEvent.setup()
    const sampleRestrooms = restrooms.slice(0, 3)
    const originalValues = sampleRestrooms.map(({ isAvailable, restrictedAccess, stallType }) => ({ isAvailable, restrictedAccess, stallType }))

    try {
      sampleRestrooms[0].isAvailable = true
      sampleRestrooms[0].stallType = "single"
      sampleRestrooms[0].restrictedAccess = true
      sampleRestrooms[1].isAvailable = false
      sampleRestrooms[1].stallType = "multi"
      sampleRestrooms[2].isAvailable = null

      await renderApp()
      await user.type(screen.getByRole("searchbox"), sampleRestrooms[0].building.name)
      await user.click(screen.getByRole("button", { name: "Search" }))
      await user.click(screen.getByRole("button", { name: new RegExp(sampleRestrooms[0].building.name, "i") }))

      expect(screen.getByText("Available")).toHaveClass("text-green-800")
      expect(screen.getByText("Out of service")).toHaveClass("text-destructive")
      expect(screen.queryByText("Unknown")).not.toBeInTheDocument()
      expect(screen.queryByText(/^Accessible$/)).not.toBeInTheDocument()
      expect(screen.queryByText(/^Not accessible$/)).not.toBeInTheDocument()
      expect(screen.queryByText("Single-stall")).not.toBeInTheDocument()
      expect(screen.queryByText("Multi-stall")).not.toBeInTheDocument()
      expect(screen.queryByText("Restricted access")).not.toBeInTheDocument()
    } finally {
      sampleRestrooms.forEach((restroom, index) => {
        Object.assign(restroom, originalValues[index])
      })
    }
  })

  it("shows available GSPP restrooms, its water station, and Evans vending machines", async () => {
    const user = userEvent.setup()
    vi.mocked(loadAmenitiesForBuilding).mockImplementation(async (building) => (
      amenities
        .filter((amenity) => amenity.buildingId === building.id)
        .map((amenity) => amenity.amenityType === "waterRefillStation" ? { ...amenity, accessible: true } : amenity)
    ))
    await renderApp()
    const searchbox = screen.getByRole("searchbox")

    await user.type(searchbox, "2607 Hearst water refill")
    await user.click(screen.getByRole("button", { name: "Search" }))
    await user.click(screen.getByRole("button", { name: /2607 Hearst Avenue.*5 amenities/i }))

    expect(screen.getByRole("heading", { name: "3 Restrooms" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "1 Water refill station" })).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /^(?:Women's|Men's|Gender-inclusive) restroom/i })[0].querySelector(".lucide-toilet")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Water refill station", level: 4 }).querySelector(".lucide-droplets")).toBeInTheDocument()
    expect(screen.getByText("Goldman School of Public Policy")).toBeInTheDocument()
    expect(screen.getAllByText("Available")).toHaveLength(4)
    expect(screen.queryByText(/^Accessible$/)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Back" }))
    const returnedSearchbox = screen.getByRole("searchbox")
    await user.clear(returnedSearchbox)
    await user.type(returnedSearchbox, "Evans vending machine")
    await user.click(screen.getByRole("button", { name: "Search" }))
    await user.click(screen.getByRole("button", { name: /Evans Hall.*amenities/i }))

    expect(screen.getByRole("heading", { name: "1 Vending machine" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Vending machine", level: 4 }).querySelector(".lucide-popcorn")).toBeInTheDocument()
    const vendingMachineSection = screen.getByRole("region", { name: "1 Vending machine" })
    expect(within(vendingMachineSection).getByText("Available")).toBeInTheDocument()
  })

  it("filters building amenities by type and level", async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.type(screen.getByRole("searchbox"), "2607 Hearst")
    await user.click(screen.getByRole("button", { name: "Search" }))
    await user.click(screen.getByRole("button", { name: /2607 Hearst Avenue.*5 amenities/i }))

    const allTypes = screen.getByRole("button", { name: "Show all amenity types" })
    const restroomsFilter = screen.getByRole("button", { name: "Show restrooms" })
    const waterFilter = screen.getByRole("button", { name: "Show water refill stations" })
    expect(allTypes).toHaveAttribute("aria-pressed", "true")
    expect(restroomsFilter).toBeInTheDocument()
    expect(waterFilter).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show vending machines" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show study spaces" })).not.toBeInTheDocument()

    await user.click(waterFilter)
    expect(waterFilter).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("heading", { name: "1 Water refill station" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /Restrooms/ })).not.toBeInTheDocument()

    await user.click(allTypes)
    await user.click(screen.getByRole("combobox", { name: "Filter by level" }))
    await user.click(await screen.findByRole("option", { name: "Level 3" }))
    expect(screen.getByRole("heading", { name: "1 Restroom" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /Water refill station/ })).not.toBeInTheDocument()

    await user.click(waterFilter)
    expect(screen.getByText("No amenities match these filters.")).toBeInTheDocument()

    await user.click(allTypes)
    await user.click(screen.getByRole("combobox", { name: "Filter by level" }))
    await user.click(await screen.findByRole("option", { name: "All levels" }))
    expect(screen.getByRole("heading", { name: "3 Restrooms" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "1 Water refill station" })).toBeInTheDocument()
  })

  it("offers an other-level option for amenities without floor data", async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.type(screen.getByRole("searchbox"), "2121 Allston Street")
    await user.click(screen.getByRole("button", { name: "Search" }))
    await user.click(screen.getByRole("button", { name: /2121 Allston Street.*4 amenities/i }))
    await user.click(screen.getByRole("combobox", { name: "Filter by level" }))
    await user.click(await screen.findByRole("option", { name: "Others" }))

    expect(screen.getByRole("combobox", { name: "Filter by level" })).toHaveTextContent("Others")
    expect(screen.getByRole("heading", { name: "4 Restrooms" })).toBeInTheDocument()
  })

  it("does not search restroom locations", async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.type(screen.getByRole("searchbox"), "N658A")
    await user.click(screen.getByRole("button", { name: "Search" }))

    expect(screen.getByText("No matching buildings found.")).toBeInTheDocument()
  })

  it("opens top-level drawer views and keeps the drawer open", async () => {
    const user = userEvent.setup()
    await renderApp()
    const drawer = document.querySelector('[data-slot="drawer-popup"]')

    expect(drawer).toHaveAttribute("data-snap-points", "")
    expect(drawer).not.toHaveAttribute("data-expanded")

    await user.click(screen.getByRole("button", { name: "Add Amenity" }))
    expect(drawer).toHaveAttribute("data-expanded", "")
    expect(screen.getByRole("heading", { name: "Add an amenity" })).toBeInTheDocument()
    expect(screen.getByText("Amenity submissions are not enabled yet.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Submissions unavailable" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Settings" }))
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument()
    expect(screen.getByText("Sign in securely through Google.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Gender" })).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument()
  })

  it("signs in with Google and shows the authenticated identity", async () => {
    const user = userEvent.setup()
    await renderApp()

    expect(screen.queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Settings" }))
    await user.click(screen.getByRole("button", { name: "Sign in with Google" }))

    expect(signInWithGoogle).toHaveBeenCalledOnce()
    expect(screen.getByText("Test User")).toBeInTheDocument()
    expect(screen.getByText("test.user@example.com")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument()
  })

  it("shows an authentication loading state until Firebase restores the session", async () => {
    vi.mocked(observeAuthState).mockImplementation(() => vi.fn())
    await renderApp()

    expect(screen.queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole("button", { name: "Settings" }))
    expect(screen.getByRole("status")).toHaveTextContent("Checking sign-in...")
  })

  it("keeps settings usable when authentication initialization fails", async () => {
    vi.mocked(observeAuthState).mockImplementation((_onChange, onError) => {
      onError(new Error("Firebase is not configured"))
      return vi.fn()
    })
    await renderApp()

    await userEvent.setup().click(screen.getByRole("button", { name: "Settings" }))

    expect(screen.getByRole("alert")).toHaveTextContent("Authentication could not be initialized")
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeInTheDocument()
  })

  it("signs out the current Google user", async () => {
    const user = userEvent.setup()
    vi.mocked(observeAuthState).mockImplementation((onChange) => {
      onChange(signedInUser)
      return vi.fn()
    })
    await renderApp()

    await user.click(screen.getByRole("button", { name: "Settings" }))
    await user.click(screen.getByRole("button", { name: "Sign out" }))

    expect(signOutCurrentUser).toHaveBeenCalledOnce()
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeInTheDocument()
  })

  it("shows Google authentication errors in settings", async () => {
    const user = userEvent.setup()
    vi.mocked(signInWithGoogle).mockRejectedValueOnce(new Error("popup blocked"))
    await renderApp()

    await user.click(screen.getByRole("button", { name: "Settings" }))
    await user.click(screen.getByRole("button", { name: "Sign in with Google" }))

    expect(authenticationErrorMessage).toHaveBeenCalledOnce()
    expect(await screen.findByRole("alert")).toHaveTextContent("Google sign-in could not be completed")
  })

  it("silently handles a cancelled Google popup", async () => {
    const user = userEvent.setup()
    vi.mocked(signInWithGoogle).mockRejectedValueOnce(new Error("popup closed"))
    vi.mocked(authenticationErrorMessage).mockReturnValueOnce(null)
    await renderApp()

    await user.click(screen.getByRole("button", { name: "Settings" }))
    await user.click(screen.getByRole("button", { name: "Sign in with Google" }))

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("saves the selected gender for the current session", async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole("button", { name: "Settings" }))
    await user.click(screen.getByRole("combobox", { name: "Gender" }))
    await user.click(await screen.findByRole("option", { name: "Non-binary" }))
    await user.click(screen.getByRole("button", { name: "Save preferences" }))

    await user.click(screen.getByRole("button", { name: "Back" }))
    await user.click(screen.getByRole("button", { name: "Settings" }))
    expect(screen.getByRole("combobox", { name: "Gender" })).toHaveTextContent("Non-binary")
    await user.click(screen.getByRole("button", { name: "Back" }))

    await user.type(screen.getByRole("searchbox"), "Cory Hall")
    await user.click(screen.getByRole("button", { name: "Search" }))
    await user.click(screen.getByRole("button", { name: /Cory Hall.*14 amenities/i }))

    expect(screen.getAllByRole("button", { name: /^(?:Women's|Men's|Gender-inclusive) restroom/i })[0]).toHaveAccessibleName(/^Gender-inclusive restroom/)
  })

  it("shows live distances for nearest, searched, and selected buildings", async () => {
    const user = userEvent.setup()
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key")
    const locationBuildings = [
      { ...buildings[0], name: "Far Building", shortName: null, coordinates: { latitude: 37.03, longitude: -122.25 } },
      { ...buildings[1], name: "Second Building", shortName: null, coordinates: { latitude: 37.01, longitude: -122.25 } },
      { ...buildings[2], name: "Nearest Building", shortName: null, coordinates: { latitude: 37.001, longitude: -122.25 } },
      { ...buildings[3], name: "Third Building", shortName: null, coordinates: { latitude: 37.02, longitude: -122.25 } },
    ]
    vi.mocked(loadBuildings).mockResolvedValue(locationBuildings)
    let updatePosition: PositionCallback = () => {}
    vi.stubGlobal("navigator", {
      geolocation: {
        clearWatch: vi.fn(),
        watchPosition: vi.fn((onSuccess: PositionCallback) => {
          updatePosition = onSuccess
          return 42
        }),
      },
    })
    installGoogleMapsMock()
    const { unmount } = await renderApp()

    const emptyNearestRegion = screen.getByRole("region", { name: "Nearest Buildings" })
    expect(within(emptyNearestRegion).queryAllByRole("button")).toHaveLength(0)

    act(() => updatePosition({
      coords: {
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        latitude: 37,
        longitude: -122.25,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: 1,
      toJSON: () => ({}),
    }))

    const nearestRegion = screen.getByRole("region", { name: "Nearest Buildings" })
    expect(within(nearestRegion).getAllByRole("button").map((button) => button.textContent)).toEqual([
      expect.stringContaining("Nearest Building"),
      expect.stringContaining("Second Building"),
      expect.stringContaining("Third Building"),
    ])
    expect(within(nearestRegion).getByText("0.07 mi")).toHaveStyle({ color: "#34A853" })
    expect(within(nearestRegion).getByText("0.69 mi")).toHaveStyle({ color: "#EA4335" })
    expect(within(nearestRegion).getByText("1.4 mi")).toBeInTheDocument()
    expect(within(nearestRegion).queryByText("Far Building")).not.toBeInTheDocument()

    act(() => updatePosition({
      coords: {
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        latitude: 37.0005,
        longitude: -122.25,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: 2,
      toJSON: () => ({}),
    }))
    expect(within(nearestRegion).getByText("0.03 mi")).toBeInTheDocument()

    await user.type(screen.getByRole("searchbox"), "Far Building")
    await user.click(screen.getByRole("button", { name: "Search" }))

    const searchRegion = screen.getByRole("region", { name: "Campus Buildings" })
    expect(within(searchRegion).getAllByRole("button")).toHaveLength(1)
    expect(within(searchRegion).getByText("Far Building")).toBeInTheDocument()
    expect(within(searchRegion).getByText("2.0 mi")).toBeInTheDocument()
    expect(within(searchRegion).queryByText("Nearest Building")).not.toBeInTheDocument()

    await user.click(within(searchRegion).getByRole("button", { name: /Far Building/ }))
    expect(await screen.findByRole("heading", { name: "Far Building" })).toBeInTheDocument()
    expect(screen.getByText("2.0 mi")).toBeInTheDocument()
    unmount()
  })

  it("shows every building on the map and opens it when selected", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key")
    const { maps, markers, polygonFeatures } = installGoogleMapsMock()
    const { unmount } = await renderApp()

    await waitFor(() => expect(markers).toHaveLength(buildings.length))

    const coryBuilding = buildings.find((building) => building.name === "Cory Hall")
    const coryMarker = markers.find((marker) => marker.options.title === "Cory Hall")
    const offCampusMarker = markers.find((marker) => marker.options.title === "1893 Le Roy Avenue")

    expect(maps[0].options.mapId).toBe("test-map-id")
    expect(maps[0].data.addGeoJson).toHaveBeenCalledWith(expect.objectContaining({
      type: "FeatureCollection",
    }))
    expect(maps[0].data.setStyle).toHaveBeenCalledWith({
      clickable: false,
      fillColor: "#FDB515",
      fillOpacity: 0.2,
      strokeOpacity: 0,
      strokeWeight: 0,
    })
    expect(coryMarker?.options.position).toEqual({
      lat: coryBuilding?.coordinates.latitude,
      lng: coryBuilding?.coordinates.longitude,
    })
    expect(coryMarker?.options).toMatchObject({
      anchorLeft: "-50%",
      anchorTop: "-50%",
      collisionBehavior: "OPTIONAL_AND_HIDES_LOWER_PRIORITY",
      gmpClickable: true,
    })
    expect(coryMarker?.options.content).toHaveClass("campus-building-label")
    expect(coryMarker?.options.content).toHaveTextContent("Cory Hall")
    expect(coryMarker?.map).toBe(maps[0])
    expect(offCampusMarker?.map).toBe(maps[0])

    act(() => maps[0].setZoom(15))
    expect(markers.every((marker) => marker.map === maps[0])).toBe(true)

    act(() => coryMarker?.click())

    expect(maps[0].panTo).toHaveBeenCalledWith(coryMarker?.options.position)
    expect(maps[0].panBy).toHaveBeenCalledWith(0, 108)
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "Cory Hall" })).toBeInTheDocument()
    expect(screen.queryByText("14 total amenities")).not.toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /^(?:Women's|Men's|Gender-inclusive) restroom/i })).toHaveLength(10)

    unmount()
    expect(markers.every((marker) => marker.removeEventListener.mock.calls.length === 1)).toBe(true)
    expect(markers.every((marker) => marker.map === null)).toBe(true)
    expect(maps[0].data.remove).toHaveBeenCalledWith(polygonFeatures[0])
  })

  it("shows one walking route for the selected building until leaving its details", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key")
    let updatePosition: PositionCallback = () => {}
    vi.stubGlobal("navigator", {
      geolocation: {
        clearWatch: vi.fn(),
        watchPosition: vi.fn((onSuccess: PositionCallback) => {
          updatePosition = onSuccess
          return 42
        }),
      },
    })
    const { computeRoutes, maps, markers, polylines, routeViewport } = installGoogleMapsMock()
    const { unmount } = await renderApp()

    await waitFor(() => expect(markers).toHaveLength(buildings.length))
    act(() => updatePosition({
      coords: {
        accuracy: 14,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        latitude: 37.8721,
        longitude: -122.2579,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: 1,
      toJSON: () => ({}),
    }))

    const coryBuilding = buildings.find((building) => building.name === "Cory Hall")!
    act(() => markers.find((marker) => marker.options.title === "Cory Hall")?.click())

    await screen.findByRole("heading", { name: "Cory Hall" })
    await waitFor(() => expect(computeRoutes).toHaveBeenCalledOnce())
    expect(computeRoutes).toHaveBeenCalledWith({
      destination: {
        lat: coryBuilding.coordinates.latitude,
        lng: coryBuilding.coordinates.longitude,
      },
      fields: ["path", "viewport"],
      origin: { lat: 37.8721, lng: -122.2579 },
      travelMode: "WALKING",
    })
    expect(polylines).toHaveLength(1)
    expect(polylines[0].options).toEqual({
      polylineOptions: {
        clickable: false,
        strokeColor: "#003262",
        strokeOpacity: 0.9,
        strokeWeight: 4,
      },
    })
    expect(polylines[0].map).toBe(maps[0])
    expect(maps[0].fitBounds).toHaveBeenCalledWith(routeViewport, {
      top: 64,
      right: 24,
      bottom: 280,
      left: 24,
    })

    act(() => updatePosition({
      coords: {
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        latitude: 37.8722,
        longitude: -122.258,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: 2,
      toJSON: () => ({}),
    }))
    expect(computeRoutes).toHaveBeenCalledOnce()

    await userEvent.setup().click(screen.getAllByRole("button", { name: /^(?:Women's|Men's|Gender-inclusive) restroom/i })[0])
    expect(screen.getByText("Cory Hall")).toBeInTheDocument()
    expect(polylines[0].map).toBe(maps[0])

    await userEvent.setup().click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByRole("heading", { name: "Cory Hall" })).toBeInTheDocument()
    expect(polylines[0].map).toBe(maps[0])
    expect(maps[0].setZoom).not.toHaveBeenCalled()

    await userEvent.setup().click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByRole("searchbox")).toBeInTheDocument()
    expect(polylines[0].setMap).toHaveBeenLastCalledWith(null)
    expect(polylines[0].map).toBeNull()
    expect(maps[0].setZoom).toHaveBeenCalledOnce()
    expect(maps[0].setZoom).toHaveBeenCalledWith(16)

    maps[0].setZoom.mockClear()
    maps[0].fitBoundsZoom = 19
    act(() => markers.find((marker) => marker.options.title === "Cory Hall")?.click())

    await waitFor(() => expect(computeRoutes).toHaveBeenCalledTimes(2))
    expect(maps[0].zoom).toBe(18.5)
    expect(maps[0].setZoom).not.toHaveBeenCalled()
    expect(maps[0].options.minZoom).toBe(14)
    expect(maps[0].options.maxZoom).toBe(18.5)
    unmount()
  })

  it("tracks the user's current position with a Google-style marker and accuracy halo", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key")
    let updatePosition: PositionCallback = () => {}
    const geolocation = {
      clearWatch: vi.fn(),
      watchPosition: vi.fn((onSuccess: PositionCallback) => {
        updatePosition = onSuccess
        return 42
      }),
    }
    vi.stubGlobal("navigator", { geolocation })
    const { circles, maps, markers } = installGoogleMapsMock()
    const { unmount } = await renderApp()

    await waitFor(() => expect(geolocation.watchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    ))

    act(() => updatePosition({
      coords: {
        accuracy: 14,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        latitude: 37.8721,
        longitude: -122.2579,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: 1,
      toJSON: () => ({}),
    }))

    const locationMarker = markers.find((marker) => marker.options.title === "Your location")
    expect(locationMarker?.options).toMatchObject({
      anchorLeft: "-50%",
      anchorTop: "-50%",
      collisionBehavior: "REQUIRED",
      position: { lat: 37.8721, lng: -122.2579 },
      zIndex: 2_147_483_647,
    })
    expect(locationMarker?.options.content).toHaveClass("current-location-dot")
    expect(locationMarker?.map).toBe(maps[0])
    expect(maps[0].panTo).toHaveBeenCalledOnce()
    expect(maps[0].panTo).toHaveBeenCalledWith({ lat: 37.8721, lng: -122.2579 })
    expect(maps[0].panBy).toHaveBeenCalledOnce()
    expect(maps[0].panBy).toHaveBeenCalledWith(0, 108)
    expect(circles[0].options).toMatchObject({
      center: { lat: 37.8721, lng: -122.2579 },
      clickable: false,
      fillColor: "#4285f4",
      fillOpacity: 0.15,
      radius: 14,
      strokeColor: "#4285f4",
    })

    act(() => updatePosition({
      coords: {
        accuracy: 8,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        latitude: 37.873,
        longitude: -122.259,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: 2,
      toJSON: () => ({}),
    }))

    expect(locationMarker?.position).toEqual({ lat: 37.873, lng: -122.259 })
    expect(circles[0].center).toEqual({ lat: 37.873, lng: -122.259 })
    expect(circles[0].radius).toBe(8)
    expect(maps[0].panTo).toHaveBeenCalledOnce()
    expect(maps[0].panBy).toHaveBeenCalledOnce()

    unmount()
    expect(geolocation.clearWatch).toHaveBeenCalledWith(42)
    expect(locationMarker?.map).toBeNull()
    expect(circles[0].setMap).toHaveBeenCalledWith(null)
  })

  it("does not override a manual pan while waiting for the user's location", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key")
    let updatePosition: PositionCallback = () => {}
    vi.stubGlobal("navigator", {
      geolocation: {
        clearWatch: vi.fn(),
        watchPosition: vi.fn((onSuccess: PositionCallback) => {
          updatePosition = onSuccess
          return 42
        }),
      },
    })
    const { maps } = installGoogleMapsMock()
    const { unmount } = await renderApp()

    await waitFor(() => expect(maps).toHaveLength(1))
    act(() => maps[0].startDrag())
    act(() => updatePosition({
      coords: {
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        latitude: 37.8721,
        longitude: -122.2579,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: 1,
      toJSON: () => ({}),
    }))

    expect(maps[0].panTo).not.toHaveBeenCalled()
    expect(maps[0].panBy).not.toHaveBeenCalled()
    unmount()
  })

  it("keeps the map usable when location access is denied", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key")
    const geolocation = {
      clearWatch: vi.fn(),
      watchPosition: vi.fn((_onSuccess: PositionCallback, onError: PositionErrorCallback) => {
        onError({ code: 1, message: "Permission denied", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 })
        return 7
      }),
    }
    vi.stubGlobal("navigator", { geolocation })
    const { circles, markers } = installGoogleMapsMock()
    const { unmount } = await renderApp()

    await waitFor(() => expect(markers).toHaveLength(buildings.length))
    expect(circles).toHaveLength(0)
    expect(within(screen.getByRole("region", { name: "Nearest Buildings" })).queryAllByRole("button")).toHaveLength(0)
    expect(screen.queryByText("Google Maps failed to load.")).not.toBeInTheDocument()

    unmount()
    expect(geolocation.clearWatch).toHaveBeenCalledWith(7)
  })

  it("shows a useful message when Google Maps rejects the key", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key")
    await renderApp()

    expect(window.gm_authFailure).toBeTypeOf("function")
    act(() => window.gm_authFailure?.())

    expect(screen.getByText("Google Maps could not be authorized.")).toBeInTheDocument()
  })
})
