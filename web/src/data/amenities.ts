import { get, ref } from "firebase/database"

import { getFirebaseDatabase } from "@/lib/firebase"

export type AmenityType =
  | "restroom"
  | "waterRefillStation"
  | "vendingMachine"
  | "studySpace"
  | "lactationRoom"
  | "microwave"
  | "zeroWasteStation"
  | "eatery"
  | "campusGarden"
  | "basicNeedService"
  | "changingTable"
  | "menstrualProduct"

export type AmenityCounts = { total: number } & Record<AmenityType, number>
export type RestroomCategory = "women" | "men" | "genderInclusive"
export type RestroomCategoryCounts = Record<RestroomCategory, number>

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
  amenityCounts: AmenityCounts
  restroomCategoryCounts: RestroomCategoryCounts
  availableAmenityTypes: AmenityType[]
}

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
  category: RestroomCategory
  accessible: boolean
  stallType: "single" | "multi" | null
  restrictedAccess: boolean
  sourceText: string
}

export type GeneralAmenity = AmenityBase & {
  amenityType: Exclude<AmenityType, "restroom">
  floorNumber: string | null
  roomNumber: string | null
  locationDetails: string | null
  isAvailable: boolean | null
  accessible: boolean | null
  operatingHours: string | null
  rating: number | null
  notes: string | null
}

export type Amenity = Restroom | GeneralAmenity

const amenityTypes: AmenityType[] = [
  "restroom",
  "waterRefillStation",
  "vendingMachine",
  "studySpace",
  "lactationRoom",
  "microwave",
  "zeroWasteStation",
  "eatery",
  "campusGarden",
  "basicNeedService",
  "changingTable",
  "menstrualProduct",
]
const amenityBranches: Record<AmenityType, string> = {
  restroom: "restrooms",
  waterRefillStation: "waterRefillStations",
  vendingMachine: "vendingMachines",
  studySpace: "studySpaces",
  lactationRoom: "lactationRooms",
  microwave: "microwaves",
  zeroWasteStation: "zeroWasteStations",
  eatery: "eateries",
  campusGarden: "campusGardens",
  basicNeedService: "basicNeedServices",
  changingTable: "changingTables",
  menstrualProduct: "menstrualProducts",
}

export function amenityBranchForType(amenityType: AmenityType) {
  return amenityBranches[amenityType]
}
const restroomCategories: Restroom["category"][] = ["women", "men", "genderInclusive"]

function recordValue(value: unknown, description: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`Invalid ${description}`)
  return value as Record<string, unknown>
}

function stringValue(value: unknown, description: string) {
  if (typeof value !== "string") throw new Error(`Invalid ${description}`)
  return value
}

function nullableString(value: unknown, description: string) {
  if (value === null || value === undefined) return null
  return stringValue(value, description)
}

function numberValue(value: unknown, description: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Invalid ${description}`)
  return value
}

function nullableNumber(value: unknown, description: string) {
  if (value === null || value === undefined) return null
  return numberValue(value, description)
}

function booleanValue(value: unknown, description: string) {
  if (typeof value !== "boolean") throw new Error(`Invalid ${description}`)
  return value
}

function nullableBoolean(value: unknown, description: string) {
  if (value === null || value === undefined) return null
  return booleanValue(value, description)
}

function enumValue<T extends string>(value: unknown, values: readonly T[], description: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw new Error(`Invalid ${description}`)
  return value as T
}

function parseBuilding(value: unknown, documentId: string): Building {
  const data = recordValue(value, `building ${documentId}`)
  const coordinates = recordValue(data.coordinates, `coordinates for building ${documentId}`)
  const counts = recordValue(data.amenityCounts, `amenity counts for building ${documentId}`)
  const restroomCategoryCounts = data.restroomCategoryCounts === undefined
    ? { women: 0, men: 0, genderInclusive: 0 }
    : recordValue(data.restroomCategoryCounts, `restroom category counts for building ${documentId}`)
  const availableTypes = data.availableAmenityTypes ?? []
  if (!Array.isArray(availableTypes)) throw new Error(`Invalid amenity types for building ${documentId}`)
  const id = numberValue(data.id, `id for building ${documentId}`)
  if (documentId !== `building_${id}`) throw new Error(`Invalid key for building ${documentId}`)

  return {
    id,
    gisId: nullableNumber(data.gisId, `GIS id for building ${documentId}`),
    caan: nullableString(data.caan, `CAAN for building ${documentId}`),
    name: stringValue(data.name, `name for building ${documentId}`),
    shortName: nullableString(data.shortName, `short name for building ${documentId}`),
    coordinates: {
      latitude: numberValue(coordinates.latitude, `latitude for building ${documentId}`),
      longitude: numberValue(coordinates.longitude, `longitude for building ${documentId}`),
    },
    amenityCounts: {
      total: numberValue(counts.total, `total amenity count for building ${documentId}`),
      ...Object.fromEntries(
        amenityTypes.map((amenityType) => [
          amenityType,
          numberValue(counts[amenityType], `${amenityType} count for building ${documentId}`),
        ]),
      ),
    } as AmenityCounts,
    restroomCategoryCounts: {
      women: numberValue(restroomCategoryCounts.women, `women restroom count for building ${documentId}`),
      men: numberValue(restroomCategoryCounts.men, `men restroom count for building ${documentId}`),
      genderInclusive: numberValue(restroomCategoryCounts.genderInclusive, `gender-inclusive restroom count for building ${documentId}`),
    },
    availableAmenityTypes: availableTypes.map((type) => enumValue(type, amenityTypes, `amenity type for building ${documentId}`)),
  }
}

function parseAmenity(value: unknown, documentId: string, building: Building): Amenity {
  const data = recordValue(value, `amenity ${documentId}`)
  const amenityType = enumValue(data.amenityType, amenityTypes, `type for amenity ${documentId}`)
  const base = {
    id: stringValue(data.id, `id for amenity ${documentId}`),
    buildingId: numberValue(data.buildingId, `building id for amenity ${documentId}`),
    amenityType,
    building,
  }

  if (base.id !== documentId) throw new Error(`Invalid key for amenity ${documentId}`)
  if (base.buildingId !== building.id) throw new Error(`Amenity ${documentId} belongs to an unexpected building`)

  if (amenityType === "restroom") {
    return {
      ...base,
      amenityType,
      floorNumber: nullableString(data.floorNumber, `floor for amenity ${documentId}`),
      roomNumber: nullableString(data.roomNumber, `room for amenity ${documentId}`),
      isAvailable: nullableBoolean(data.isAvailable, `availability for amenity ${documentId}`),
      category: enumValue(data.category, restroomCategories, `category for amenity ${documentId}`),
      accessible: booleanValue(data.accessible, `accessibility for amenity ${documentId}`),
      stallType: data.stallType === null || data.stallType === undefined ? null : enumValue(data.stallType, ["single", "multi"] as const, `stall type for amenity ${documentId}`),
      restrictedAccess: booleanValue(data.restrictedAccess, `access restriction for amenity ${documentId}`),
      sourceText: stringValue(data.sourceText, `source text for amenity ${documentId}`),
    }
  }

  return {
    ...base,
    amenityType,
    floorNumber: nullableString(data.floorNumber, `floor for amenity ${documentId}`),
    roomNumber: nullableString(data.roomNumber, `room for amenity ${documentId}`),
    locationDetails: nullableString(data.locationDetails, `location details for amenity ${documentId}`),
    isAvailable: nullableBoolean(data.isAvailable, `availability for amenity ${documentId}`),
    accessible: nullableBoolean(data.accessible, `accessibility for amenity ${documentId}`),
    operatingHours: nullableString(data.operatingHours, `operating hours for amenity ${documentId}`),
    rating: nullableNumber(data.rating, `rating for amenity ${documentId}`),
    notes: nullableString(data.notes, `notes for amenity ${documentId}`),
  }
}

export async function loadBuildings() {
  const snapshot = await get(ref(getFirebaseDatabase(), "buildings"))
  const records = snapshot.val()
  if (records === null) return []

  return Object.entries(recordValue(records, "buildings"))
    .map(([id, building]) => parseBuilding(building, id))
    .sort((first, second) => first.name.localeCompare(second.name))
}

export async function loadAmenitiesForBuilding(building: Building) {
  const snapshot = await get(ref(getFirebaseDatabase(), `amenitiesByBuilding/${building.id}`))
  const value = snapshot.val()
  if (value === null) return []
  const branches = recordValue(value, `amenities for building ${building.id}`)

  return amenityTypes.flatMap((amenityType) => {
    const branchValue = branches[amenityBranches[amenityType]]
    if (branchValue === null || branchValue === undefined) return []

    return Object.entries(recordValue(branchValue, `${amenityType} amenities for building ${building.id}`))
      .map(([id, amenity]) => {
        const parsedAmenity = parseAmenity(amenity, id, building)
        if (parsedAmenity.amenityType !== amenityType) {
          throw new Error(`Amenity ${id} is stored in the wrong type branch`)
        }
        return parsedAmenity
      })
  })
}
