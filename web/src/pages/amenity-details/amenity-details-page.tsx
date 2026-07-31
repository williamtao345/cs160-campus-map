import { ChevronsUpDownIcon, RouteIcon } from "lucide-react"

import { restroomCategoryLabel } from "@/components/amenities/amenity-metadata"
import { Button } from "@/components/ui/button"
import type { Restroom } from "@/data/amenities"

export function AmenityDetailsPage({
  isDrawerExpanded,
  onToggleDrawer,
  amenity,
}: {
  isDrawerExpanded: boolean
  onToggleDrawer: () => void
  amenity: Restroom
}) {
  const details = [
    ...(amenity.floorNumber ? [["Floor", amenity.floorNumber]] : []),
    ...(amenity.roomNumber ? [["Room number", amenity.roomNumber]] : []),
    ["Accessibility", amenity.accessible ? "Accessible" : "Not accessible"],
    ...(amenity.stallType ? [["Stall type", `${amenity.stallType === "single" ? "Single" : "Multi"}-stall`]] : []),
    ["Access", amenity.restrictedAccess ? "Restricted" : "General campus access"],
  ]

  return (
    <article className="space-y-5">
      <header className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-heading text-xl font-medium">{restroomCategoryLabel(amenity.category)} restroom</h2>
          <Button type="button" size="lg" onClick={onToggleDrawer}>
            {isDrawerExpanded
              ? <RouteIcon data-icon="inline-start" aria-hidden="true" />
              : <ChevronsUpDownIcon data-icon="inline-start" aria-hidden="true" />}
            {isDrawerExpanded ? "View route" : "Expand"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{amenity.building.name}</p>
      </header>
      <dl className="space-y-3 text-sm">
        {details.map(([term, description]) => (
          <div key={term} className="flex justify-between gap-6 border-b pb-3 last:border-0">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className="text-right font-medium">{description}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
