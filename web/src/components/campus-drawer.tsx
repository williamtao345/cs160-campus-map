import type { ReactNode } from "react"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"

export const defaultCollapsedSnapPoint = "16rem"
export const amenityCollapsedSnapPoint = "6rem"

export function CampusDrawer({
  children,
  collapsedSnapPoint = defaultCollapsedSnapPoint,
  onBack,
  onSnapPointChange,
  showBack,
  snapPoint,
}: {
  children: ReactNode
  collapsedSnapPoint?: string | number
  onBack: () => void
  onSnapPointChange: (snapPoint: string | number) => void
  showBack: boolean
  snapPoint: string | number
}) {
  return (
    <Drawer
      open
      modal={false}
      disablePointerDismissal
      showSwipeHandle
      snapPoints={[collapsedSnapPoint, 1]}
      snapPoint={snapPoint}
      snapToSequentialPoints
      onOpenChange={(open, eventDetails) => {
        if (!open) eventDetails.cancel()
      }}
      onSnapPointChange={(nextSnapPoint) => {
        if (nextSnapPoint !== null) onSnapPointChange(nextSnapPoint)
      }}
    >
      <DrawerContent className="mx-auto max-w-xl">
        <DrawerTitle className="sr-only">Campus information</DrawerTitle>
        <DrawerDescription className="sr-only">Search, view, and add campus amenities.</DrawerDescription>
        <div className="drawer-main-content flex-1 overflow-y-auto overscroll-contain p-4">
          <div className="mx-auto max-w-lg">
            {showBack && (
              <Button type="button" variant="outline" className="mb-5" onClick={onBack}>
                <ArrowLeftIcon aria-hidden="true" />
                Back
              </Button>
            )}
            {children}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
