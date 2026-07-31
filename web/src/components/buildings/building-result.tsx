import { buildingAmenityIcons } from "@/components/amenities/amenity-metadata"
import { DistanceLabel } from "@/components/location/distance-label"
import { Badge } from "@/components/ui/badge"
import type { BuildingSearchResult } from "@/data/building-search"
import type { Coordinates } from "@/lib/geo"

export function BuildingResult({
  position,
  result,
  onSelect,
}: {
  position: Coordinates | null
  result: BuildingSearchResult
  onSelect: () => void
}) {
  const { building, amenityCounts } = result

  return (
    <button type="button" className="block w-full rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={onSelect}>
      <div className="flex w-full items-start justify-between gap-4 rounded-xl bg-card p-3 text-sm text-card-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted/50">
        <div className="min-w-0 flex-1">
          <p className="font-heading font-medium leading-snug text-primary">{building.shortName ?? building.name}</p>
          {amenityCounts.total > 0 && (
            <div className="mt-2 flex items-center gap-1" aria-label="Available amenity types">
              {buildingAmenityIcons.map(({ amenityType, label, Icon }) => amenityCounts[amenityType] > 0 && (
                <span key={amenityType} className="grid size-6 place-items-center text-foreground" aria-label={label} title={label}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {position !== null && (
            <DistanceLabel
              origin={position}
              destination={building.coordinates}
              className="whitespace-nowrap text-xs font-medium"
            />
          )}
          <Badge variant={amenityCounts.total === 0 ? "destructive" : "secondary"}>
            {amenityCounts.total.toLocaleString()} {amenityCounts.total === 1 ? "amenity" : "amenities"}
          </Badge>
        </div>
      </div>
    </button>
  )
}
