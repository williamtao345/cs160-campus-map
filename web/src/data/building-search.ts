import type { AmenityType, Building, RestroomCategory } from "@/data/amenities"
import { distanceInMiles, type Coordinates } from "@/lib/geo"

export type BuildingSearchResult = {
  building: Building
  amenityCounts: Building["amenityCounts"]
}

const nearestBuildingLimit = 10
const amenitySearchTerms: Record<AmenityType, string> = {
  restroom: "restroom restrooms bathroom bathrooms",
  waterRefillStation: "water refill station stations bottle filling",
  vendingMachine: "vending machine machines",
  studySpace: "study space spaces",
  lactationRoom: "lactation room rooms nursing",
  microwave: "microwave microwaves",
  zeroWasteStation: "zero waste station stations recycling compost",
  eatery: "eatery eateries food cafe restaurant dining",
  campusGarden: "campus garden gardens",
  basicNeedService: "basic needs service services food pantry",
  changingTable: "changing table tables diaper",
  menstrualProduct: "menstrual product products period",
}

export function searchBuildings(buildings: Building[], queryValue: string) {
  const terms = queryValue.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)

  return buildings.flatMap((building): BuildingSearchResult[] => {
    const searchableText = [
      building.name,
      building.shortName,
      ...building.availableAmenityTypes.map((type) => amenitySearchTerms[type]),
    ].filter(Boolean).join(" ").toLocaleLowerCase()
    const matches = terms.length === 0 || terms.every((term) => searchableText.includes(term))
    return matches ? [{ building, amenityCounts: building.amenityCounts }] : []
  })
}

export function nearestBuildings(buildings: Building[], position: Coordinates): BuildingSearchResult[] {
  return buildings
    .map((building) => ({ building, distance: distanceInMiles(position, building.coordinates) }))
    .sort((first, second) => (
      first.distance - second.distance
      || first.building.name.localeCompare(second.building.name)
      || first.building.id - second.building.id
    ))
    .slice(0, nearestBuildingLimit)
    .map(({ building }) => ({ building, amenityCounts: building.amenityCounts }))
}

export function rankSearchResults(
  results: BuildingSearchResult[],
  preferredCategory: RestroomCategory | null,
  position: Coordinates | null,
) {
  return [...results].sort((first, second) => {
    const preferenceOrder = preferredCategory === null ? 0 : (
      Number(second.building.restroomCategoryCounts[preferredCategory] > 0)
      - Number(first.building.restroomCategoryCounts[preferredCategory] > 0)
    )
    if (preferenceOrder !== 0) return preferenceOrder

    const distanceOrder = position === null ? 0 : (
      distanceInMiles(position, first.building.coordinates)
      - distanceInMiles(position, second.building.coordinates)
    )
    return distanceOrder
      || first.building.name.localeCompare(second.building.name)
      || first.building.id - second.building.id
  })
}
