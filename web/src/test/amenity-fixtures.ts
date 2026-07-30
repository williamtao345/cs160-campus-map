import basicNeedServiceData from "@/data/basic-needs-services.json"
import buildingData from "@/data/buildings.json"
import campusGardenData from "@/data/campus-gardens.json"
import changingTableData from "@/data/changing-tables.json"
import eateryData from "@/data/eateries.json"
import lactationRoomData from "@/data/lactation-rooms.json"
import menstrualProductData from "@/data/menstrual-products.json"
import microwaveData from "@/data/microwaves.json"
import restroomData from "@/data/restrooms.json"
import studySpaceData from "@/data/study-spaces.json"
import vendingMachineData from "@/data/vending-machines.json"
import waterRefillStationData from "@/data/water-refill-stations.json"
import zeroWasteStationData from "@/data/zero-waste-stations.json"
import type { Amenity, AmenityCounts, AmenityType, Building, GeneralAmenity, Restroom } from "@/data/amenities"

function taggedRecords<T extends AmenityType>(data: unknown, amenityType: T) {
  return (data as Array<Record<string, unknown> & { buildingId: number }>).map((amenity) => ({ ...amenity, amenityType }))
}

const amenityRecords = [
  ...restroomData.map((amenity) => ({ ...amenity, amenityType: "restroom" as const })),
  ...taggedRecords(waterRefillStationData, "waterRefillStation" as const),
  ...taggedRecords(vendingMachineData, "vendingMachine" as const),
  ...taggedRecords(studySpaceData, "studySpace" as const),
  ...taggedRecords(lactationRoomData, "lactationRoom" as const),
  ...taggedRecords(microwaveData, "microwave" as const),
  ...taggedRecords(zeroWasteStationData, "zeroWasteStation" as const),
  ...taggedRecords(eateryData, "eatery" as const),
  ...taggedRecords(campusGardenData, "campusGarden" as const),
  ...taggedRecords(basicNeedServiceData, "basicNeedService" as const),
  ...taggedRecords(changingTableData, "changingTable" as const),
  ...taggedRecords(menstrualProductData, "menstrualProduct" as const),
]

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

function countsForBuilding(buildingId: number): AmenityCounts {
  const records = amenityRecords.filter((amenity) => amenity.buildingId === buildingId)
  return {
    total: records.length,
    ...Object.fromEntries(
      amenityTypes.map((amenityType) => [amenityType, records.filter((record) => record.amenityType === amenityType).length]),
    ),
  } as AmenityCounts
}

export const buildings: Building[] = buildingData.map((building) => {
  const amenityCounts = countsForBuilding(building.id)
  const availableAmenityTypes = amenityTypes.filter((amenityType) => amenityCounts[amenityType] > 0)
  return { ...building, amenityCounts, availableAmenityTypes }
})

const buildingsById = new Map(buildings.map((building) => [building.id, building]))

export const amenities: Amenity[] = amenityRecords.map((amenity) => {
  const building = buildingsById.get(amenity.buildingId)
  if (!building) throw new Error(`Missing fixture building ${amenity.buildingId}`)
  return { ...amenity, building } as Restroom | GeneralAmenity
})

export const restrooms = amenities.filter((amenity): amenity is Restroom => amenity.amenityType === "restroom")
