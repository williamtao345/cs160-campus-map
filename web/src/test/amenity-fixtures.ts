import buildingData from "@/data/buildings.json"
import restroomData from "@/data/restrooms.json"
import studySpaceData from "@/data/study-spaces.json"
import vendingMachineData from "@/data/vending-machines.json"
import waterRefillStationData from "@/data/water-refill-stations.json"
import type { Amenity, AmenityCounts, AmenityType, Building, GeneralAmenity, Restroom } from "@/data/amenities"

const amenityRecords = [
  ...restroomData.map((amenity) => ({ ...amenity, amenityType: "restroom" as const })),
  ...(waterRefillStationData as Array<Record<string, unknown> & { buildingId: number }>).map((amenity) => ({ ...amenity, amenityType: "waterRefillStation" as const })),
  ...(vendingMachineData as Array<Record<string, unknown> & { buildingId: number }>).map((amenity) => ({ ...amenity, amenityType: "vendingMachine" as const })),
  ...(studySpaceData as Array<Record<string, unknown> & { buildingId: number }>).map((amenity) => ({ ...amenity, amenityType: "studySpace" as const })),
]

function countsForBuilding(buildingId: number): AmenityCounts {
  const records = amenityRecords.filter((amenity) => amenity.buildingId === buildingId)
  return {
    total: records.length,
    restrooms: records.filter(({ amenityType }) => amenityType === "restroom").length,
    waterRefillStations: records.filter(({ amenityType }) => amenityType === "waterRefillStation").length,
    vendingMachines: records.filter(({ amenityType }) => amenityType === "vendingMachine").length,
    studySpaces: records.filter(({ amenityType }) => amenityType === "studySpace").length,
  }
}

export const buildings: Building[] = buildingData.map((building) => {
  const amenityCounts = countsForBuilding(building.id)
  const availableAmenityTypes: AmenityType[] = []
  if (amenityCounts.restrooms > 0) availableAmenityTypes.push("restroom")
  if (amenityCounts.waterRefillStations > 0) availableAmenityTypes.push("waterRefillStation")
  if (amenityCounts.vendingMachines > 0) availableAmenityTypes.push("vendingMachine")
  if (amenityCounts.studySpaces > 0) availableAmenityTypes.push("studySpace")
  return { ...building, amenityCounts, availableAmenityTypes }
})

const buildingsById = new Map(buildings.map((building) => [building.id, building]))

export const amenities: Amenity[] = amenityRecords.map((amenity) => {
  const building = buildingsById.get(amenity.buildingId)
  if (!building) throw new Error(`Missing fixture building ${amenity.buildingId}`)
  return { ...amenity, building } as Restroom | GeneralAmenity
})

export const restrooms = amenities.filter((amenity): amenity is Restroom => amenity.amenityType === "restroom")
