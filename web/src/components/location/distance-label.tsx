import { distanceInMiles, type Coordinates } from "@/lib/geo"

function distanceLabel(distance: number) {
  return `${distance.toFixed(distance < 1 ? 2 : 1)} mi`
}

function distanceColor(distance: number) {
  if (distance <= 1) return "#34A853"
  if (distance <= 2) return "#FBBC04"
  return "#EA4335"
}

export function DistanceLabel({
  className,
  destination,
  origin,
}: {
  className?: string
  destination: Coordinates
  origin: Coordinates
}) {
  const distance = distanceInMiles(origin, destination)

  return <span className={className} style={{ color: distanceColor(distance) }}>{distanceLabel(distance)}</span>
}
