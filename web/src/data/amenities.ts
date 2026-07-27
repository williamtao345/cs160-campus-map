import buildingData from "@/data/buildings.json"
import restroomData from "@/data/restrooms.json"
import studySpaceData from "@/data/study-spaces.json"
import vendingMachineData from "@/data/vending-machines.json"
import waterRefillStationData from "@/data/water-refill-stations.json"

export type Building = {
  id: number
  gisId: number | null
  caan: string | null
  name: string
  shortName: string | null
  coordinates: {
    latitude: number
    longitude: number
  }
}

export type AmenityType = "restroom" | "waterRefillStation" | "vendingMachine" | "studySpace"

type AmenityBase = {
  id: string
  buildingId: number
  amenityType: AmenityType
  building: Building
}

export type Restroom = AmenityBase & {
  amenityType: "restroom"
  floorNumber: string | null
  roomNumber: string | null
  isAvailable: boolean | null
  category: "women" | "men" | "genderInclusive"
  accessible: boolean
  stallType: "single" | "multi" | null
  restrictedAccess: boolean
  sourceText: string
}

export type GeneralAmenity = AmenityBase & {
  amenityType: Exclude<AmenityType, "restroom">
  floorNumber: string | null
  locationDetails: string | null
  isAvailable: boolean | null
  accessible: boolean | null
  operatingHours: string | null
  rating: number | null
  notes: string | null
}

export type Amenity = Restroom | GeneralAmenity

export type AmenityCounts = {
  total: number
  restrooms: number
  waterRefillStations: number
  vendingMachines: number
  studySpaces: number
}

export type BuildingSearchResult = {
  building: Building
  amenityCounts: AmenityCounts
}

type GeneralAmenityRecord = Omit<GeneralAmenity, "amenityType" | "building">

export const buildings = buildingData as Building[]

const buildingsById = new Map(buildings.map((building) => [building.id, building]))

function buildingForAmenity(amenity: { id: string; buildingId: number }) {
  const building = buildingsById.get(amenity.buildingId)
  if (!building) throw new Error(`Missing building ${amenity.buildingId} for amenity ${amenity.id}`)
  return building
}

function loadGeneralAmenities(records: GeneralAmenityRecord[], amenityType: GeneralAmenity["amenityType"]) {
  const ids = new Set<string>()

  return records.map((record) => {
    if (ids.has(record.id)) throw new Error(`Duplicate ${amenityType} amenity ${record.id}`)
    ids.add(record.id)
    return { ...record, amenityType, building: buildingForAmenity(record) } satisfies GeneralAmenity
  })
}

export const restrooms = restroomData.map((restroom) => ({
  ...restroom,
  amenityType: "restroom" as const,
  building: buildingForAmenity(restroom),
})) as Restroom[]

export const waterRefillStations = loadGeneralAmenities(
  waterRefillStationData as GeneralAmenityRecord[],
  "waterRefillStation",
)
export const vendingMachines = loadGeneralAmenities(
  vendingMachineData as GeneralAmenityRecord[],
  "vendingMachine",
)
export const studySpaces = loadGeneralAmenities(
  studySpaceData as GeneralAmenityRecord[],
  "studySpace",
)

export const amenities: Amenity[] = [
  ...restrooms,
  ...waterRefillStations,
  ...vendingMachines,
  ...studySpaces,
]

const amenitiesByBuildingId = new Map<number, Amenity[]>()
const amenityCountsByBuildingId = new Map<number, AmenityCounts>(buildings.map((building) => [building.id, {
  total: 0,
  restrooms: 0,
  waterRefillStations: 0,
  vendingMachines: 0,
  studySpaces: 0,
}]))

amenities.forEach((amenity) => {
  const buildingAmenities = amenitiesByBuildingId.get(amenity.buildingId) ?? []
  buildingAmenities.push(amenity)
  amenitiesByBuildingId.set(amenity.buildingId, buildingAmenities)

  const counts = amenityCountsByBuildingId.get(amenity.buildingId)
  if (!counts) throw new Error(`Missing amenity counts for building ${amenity.buildingId}`)

  counts.total += 1
  if (amenity.amenityType === "restroom") counts.restrooms += 1
  if (amenity.amenityType === "waterRefillStation") counts.waterRefillStations += 1
  if (amenity.amenityType === "vendingMachine") counts.vendingMachines += 1
  if (amenity.amenityType === "studySpace") counts.studySpaces += 1
})

const amenitySearchTerms: Record<AmenityType, string> = {
  restroom: "restroom restrooms bathroom bathrooms",
  waterRefillStation: "water refill station stations bottle filling",
  vendingMachine: "vending machine machines",
  studySpace: "study space spaces",
}

export function getAmenitiesForBuilding(buildingId: number) {
  return amenitiesByBuildingId.get(buildingId) ?? []
}

export function searchBuildings(query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)

  return buildings.flatMap((building): BuildingSearchResult[] => {
    const availableTypes = new Set(getAmenitiesForBuilding(building.id).map((amenity) => amenity.amenityType))
    const searchableText = [
      building.name,
      building.shortName,
      ...Array.from(availableTypes, (type) => amenitySearchTerms[type]),
    ].filter(Boolean).join(" ").toLocaleLowerCase()
    const matches = terms.length === 0 || terms.every((term) => searchableText.includes(term))
    if (!matches) return []

    const amenityCounts = amenityCountsByBuildingId.get(building.id)
    if (!amenityCounts) throw new Error(`Missing amenity counts for building ${building.id}`)
    return [{ building, amenityCounts }]
  })
}
