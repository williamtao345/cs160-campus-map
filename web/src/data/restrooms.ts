import bathroomData from "@/data/bathrooms.json"
import buildingData from "@/data/buildings.json"

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

export type Restroom = {
  id: string
  buildingId: number
  floorNumber: string | null
  roomNumber: string | null
  isAvailable: boolean | null
  category: "women" | "men" | "genderInclusive"
  accessible: boolean
  stallType: "single" | "multi" | null
  restrictedAccess: boolean
  sourceText: string
  building: Building
}

export const buildings = buildingData as Building[]

const buildingsById = new Map(buildings.map((building) => [building.id, building]))

export const restrooms = bathroomData.map((bathroom) => {
  const building = buildingsById.get(bathroom.buildingId)
  if (!building) throw new Error(`Missing building ${bathroom.buildingId} for restroom ${bathroom.id}`)

  return { ...bathroom, building } as Restroom
})

export function searchRestrooms(query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)

  if (terms.length === 0) return restrooms

  return restrooms.filter((restroom) => {
    const searchableText = [
      restroom.building.name,
      restroom.building.shortName,
      "bathroom bathrooms restroom restrooms",
    ].filter(Boolean).join(" ").toLocaleLowerCase()

    return terms.every((term) => searchableText.includes(term))
  })
}
