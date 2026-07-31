import { PlusIcon, SettingsIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function AppActions({ onCreate, onOpenSettings }: { onCreate: () => void; onOpenSettings: () => void }) {
  return (
    <nav className="top-actions" aria-label="App actions">
      <Button type="button" className="bg-accent text-[var(--berkeley-blue-dark)] hover:bg-accent/80" onClick={onCreate}>
        <PlusIcon data-icon="inline-start" aria-hidden="true" />
        Add Amenity
      </Button>
      <Button type="button" onClick={onOpenSettings}>
        <SettingsIcon data-icon="inline-start" aria-hidden="true" />
        Settings
      </Button>
    </nav>
  )
}
