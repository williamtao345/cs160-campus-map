import { useState } from "react"

import {
  amenityTypeIcons,
  amenityTypeLabels,
  amenityTypeOrder,
  buildingAmenityIcons,
} from "@/components/amenities/amenity-metadata"
import { DistanceLabel } from "@/components/location/distance-label"
import { ButtonGroup } from "@/components/ui/button-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Amenity, AmenityType, Building, Restroom } from "@/data/amenities"
import type { Coordinates } from "@/lib/geo"
import { AmenityResult } from "@/pages/building/amenity-result"

function compareLevels(first: string, second: string) {
  const sortValue = (level: string) => {
    if (/^(b|basement)$/i.test(level)) return -2
    if (/^(g|ground)$/i.test(level)) return -1
    const numericLevel = Number(level)
    return Number.isFinite(numericLevel) ? numericLevel : Number.MAX_SAFE_INTEGER
  }

  return sortValue(first) - sortValue(second) || first.localeCompare(second, undefined, { numeric: true })
}

function levelLabel(level: string) {
  return /^(g|ground)$/i.test(level) ? "Ground" : `Level ${level}`
}

export function BuildingPage({
  building,
  amenities,
  position,
  preferredCategory,
  onSelectAmenity,
}: {
  building: Building
  amenities: Amenity[]
  position: Coordinates | null
  preferredCategory: Restroom["category"] | null
  onSelectAmenity: (amenity: Amenity) => void
}) {
  const [selectedAmenityType, setSelectedAmenityType] = useState<AmenityType | "all">("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const availableAmenityIcons = buildingAmenityIcons.filter(({ amenityType }) => (
    amenities.some((amenity) => amenity.amenityType === amenityType)
  ))
  const levels = [...new Set(amenities.flatMap((amenity) => amenity.floorNumber === null ? [] : [amenity.floorNumber]))]
    .sort(compareLevels)
  const hasUnknownLevel = amenities.some((amenity) => amenity.floorNumber === null)
  const levelItems = [
    { value: "all", label: "All levels" },
    ...levels.map((level) => ({ value: level, label: levelLabel(level) })),
    ...(hasUnknownLevel ? [{ value: "unknown", label: "Others" }] : []),
  ]
  const filteredAmenities = amenities.filter((amenity) => (
    (selectedAmenityType === "all" || amenity.amenityType === selectedAmenityType)
    && (selectedLevel === "all"
      || (selectedLevel === "unknown" ? amenity.floorNumber === null : amenity.floorNumber === selectedLevel))
  ))
  const amenitiesByType = new Map<AmenityType, Amenity[]>()
  filteredAmenities.forEach((amenity) => {
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
      <header className="flex items-start justify-between gap-4">
        <h2 className="min-w-0 font-heading text-xl font-medium">{building.name}</h2>
        {position !== null && (
          <DistanceLabel
            origin={position}
            destination={building.coordinates}
            className="shrink-0 whitespace-nowrap text-sm font-medium"
          />
        )}
      </header>

      {amenities.length > 0 && (
        <ButtonGroup className="flex-wrap" aria-label="Amenity filters">
          <ButtonGroup aria-label="Filter by amenity type">
            <ToggleGroup
              value={[selectedAmenityType]}
              onValueChange={(values) => {
                const nextValue = values[0] as AmenityType | "all" | undefined
                if (nextValue) setSelectedAmenityType(nextValue)
              }}
              variant="outline"
              spacing={0}
            >
              <ToggleGroupItem value="all" aria-label="Show all amenity types">All</ToggleGroupItem>
              {availableAmenityIcons.map(({ amenityType, Icon }) => (
                <ToggleGroupItem
                  key={amenityType}
                  value={amenityType}
                  aria-label={`Show ${amenityTypeLabels[amenityType].plural.toLocaleLowerCase()}`}
                  title={amenityTypeLabels[amenityType].plural}
                >
                  <Icon aria-hidden="true" />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </ButtonGroup>
          <ButtonGroup aria-label="Filter by level">
            <Select items={levelItems} value={selectedLevel} onValueChange={(value) => {
              if (value !== null) setSelectedLevel(value)
            }}>
              <SelectTrigger aria-label="Filter by level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" alignItemWithTrigger={false}>
                <SelectGroup>
                  {levelItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </ButtonGroup>
        </ButtonGroup>
      )}

      {amenities.length === 0 && <p className="text-sm text-muted-foreground">No amenities have been recorded for this building.</p>}
      {amenities.length > 0 && filteredAmenities.length === 0 && (
        <p className="text-sm text-muted-foreground">No amenities match these filters.</p>
      )}

      {amenityTypeOrder.map((amenityType) => {
        const groupedAmenities = amenitiesByType.get(amenityType)
        if (!groupedAmenities?.length) return null

        return (
          <section key={amenityType} className="flex flex-col gap-3" aria-labelledby={`${amenityType}-heading`}>
            <h3 id={`${amenityType}-heading`} className="text-sm font-medium">
              {groupedAmenities.length.toLocaleString()} {amenityTypeLabels[amenityType][groupedAmenities.length === 1 ? "singular" : "plural"]}
            </h3>
            <div className="flex flex-col gap-3">
              {groupedAmenities.map((amenity) => (
                <AmenityResult
                  key={amenity.id}
                  amenity={amenity}
                  onSelect={() => onSelectAmenity(amenity)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </article>
  )
}
