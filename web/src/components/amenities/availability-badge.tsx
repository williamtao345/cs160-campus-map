import { Badge } from "@/components/ui/badge"

export function AvailabilityBadge({ isAvailable }: { isAvailable: boolean | null }) {
  if (isAvailable === null) return null

  return (
    <Badge
      variant={isAvailable ? "outline" : "destructive"}
      className={isAvailable ? "border-0 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : undefined}
    >
      {isAvailable ? "Available" : "Out of service"}
    </Badge>
  )
}
