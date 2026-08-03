import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  searchBuildings,
  type Building,
  type BuildingSearchResult,
  type RestroomCategory,
} from "@/data/amenities"
import { distanceInMiles, type Coordinates } from "@/lib/geo"
import { BuildingResult } from "@/pages/search/building-result"

const resultLimit = 50
const nearestBuildingLimit = 10

function nearestBuildings(buildings: Building[], position: Coordinates): BuildingSearchResult[] {
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

export function SearchPage({
  buildings,
  isDrawerExpanded,
  onQueryChange,
  onSearch,
  onSelectBuilding,
  onToggleDrawer,
  position,
  preferredCategory,
  query,
  submittedQuery,
}: {
  buildings: Building[]
  isDrawerExpanded: boolean
  onQueryChange: (query: string) => void
  onSearch: () => void
  onSelectBuilding: (building: Building) => void
  onToggleDrawer: () => void
  position: Coordinates | null
  preferredCategory: RestroomCategory | null
  query: string
  submittedQuery: string | null
}) {
  const isSearchDisabled = query.trim().length === 0
  const hasSearched = submittedQuery !== null
  const results = submittedQuery === null
    ? position === null ? [] : nearestBuildings(buildings, position)
    : rankSearchResults(searchBuildings(buildings, submittedQuery), preferredCategory, position)
  const visibleResults = hasSearched ? results.slice(0, resultLimit) : results

  return (
    <section className="space-y-4" aria-labelledby="search-heading">
      <h2 id="search-heading" className="sr-only">Search campus buildings and amenities</h2>
      <div className="flex items-start gap-2">
        <form
          role="search"
          className="flex flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (isSearchDisabled) return
            onSearch()
          }}
        >
          <Input
            name="query"
            type="search"
            aria-label="Search buildings and amenities"
            placeholder="Search buildings or amenities"
            className="h-9"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <Button type="submit" disabled={isSearchDisabled}>Search</Button>
        </form>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={onToggleDrawer}
          aria-label={isDrawerExpanded ? "Collapse to search bar" : "Expand results"}
        >
          {isDrawerExpanded ? <ChevronDownIcon aria-hidden="true" /> : <ChevronUpIcon aria-hidden="true" />}
        </Button>
      </div>

      {isDrawerExpanded && (
        <>
          <Separator />

          <section className="space-y-3" aria-labelledby="buildings-heading" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <h2 id="buildings-heading" className="text-sm font-medium">
                {hasSearched ? "Campus Buildings" : "Buildings Near You"}
              </h2>
              {hasSearched && results.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Showing {visibleResults.length.toLocaleString()} of {results.length.toLocaleString()} results.
                </p>
              )}
            </div>
            {hasSearched && results.length === 0 && <p className="text-sm text-muted-foreground">No matching buildings found.</p>}
            {visibleResults.length > 0 && (
              <div className="flex flex-col gap-3">
                {visibleResults.map((result) => (
                  <BuildingResult
                    key={result.building.id}
                    position={position}
                    result={result}
                    onSelect={() => onSelectBuilding(result.building)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  )
}
