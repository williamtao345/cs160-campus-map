import { amenityTypeIcons, amenityTypeLabels, restroomCategoryLabel } from "@/components/amenities/amenity-metadata"
import { AvailabilityBadge } from "@/components/amenities/availability-badge"
import type { Amenity } from "@/data/amenities"

export function AmenityResult({ amenity, onSelect }: { amenity: Amenity; onSelect: () => void }) {
  const Icon = amenityTypeIcons[amenity.amenityType]
  const title = amenity.amenityType === "restroom"
    ? `${restroomCategoryLabel(amenity.category)} restroom`
    : amenityTypeLabels[amenity.amenityType].singular
  const locationLabel = [
    amenity.floorNumber ? `Floor ${amenity.floorNumber}` : null,
    amenity.roomNumber ? `Room ${amenity.roomNumber}` : null,
    amenity.amenityType === "restroom" ? null : amenity.locationDetails,
  ].filter(Boolean).join(" · ")
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <h4 className="flex items-center gap-2 font-heading font-medium leading-snug">
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          {title}
        </h4>
        {locationLabel && <p className="mt-1 text-muted-foreground">{locationLabel}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <AvailabilityBadge isAvailable={amenity.isAvailable} />
      </div>
    </>
  )

  return (
    <button type="button" className="flex w-full items-start justify-between gap-4 rounded-xl bg-card p-3 text-left text-sm text-card-foreground outline-none ring-1 ring-foreground/10 transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50" onClick={onSelect}>
      {content}
    </button>
  )
}
