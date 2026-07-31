import {
  BabyIcon,
  BookOpenIcon,
  DropletIcon,
  DropletsIcon,
  HeartHandshakeIcon,
  MicrowaveIcon,
  PopcornIcon,
  RecycleIcon,
  SproutIcon,
  ToiletIcon,
  UtensilsIcon,
} from "lucide-react"

import type { AmenityType, Restroom } from "@/data/amenities"

export const amenityTypeOrder: AmenityType[] = [
  "restroom",
  "waterRefillStation",
  "vendingMachine",
  "studySpace",
  "lactationRoom",
  "microwave",
  "zeroWasteStation",
  "eatery",
  "campusGarden",
  "basicNeedService",
  "changingTable",
  "menstrualProduct",
]

export const amenityTypeLabels: Record<AmenityType, { singular: string; plural: string }> = {
  restroom: { singular: "Restroom", plural: "Restrooms" },
  waterRefillStation: { singular: "Water refill station", plural: "Water refill stations" },
  vendingMachine: { singular: "Vending machine", plural: "Vending machines" },
  studySpace: { singular: "Study space", plural: "Study spaces" },
  lactationRoom: { singular: "Lactation room", plural: "Lactation rooms" },
  microwave: { singular: "Microwave", plural: "Microwaves" },
  zeroWasteStation: { singular: "Zero-waste station", plural: "Zero-waste stations" },
  eatery: { singular: "Eatery", plural: "Eateries" },
  campusGarden: { singular: "Campus garden", plural: "Campus gardens" },
  basicNeedService: { singular: "Basic needs service", plural: "Basic needs services" },
  changingTable: { singular: "Changing table", plural: "Changing tables" },
  menstrualProduct: { singular: "Menstrual product dispenser", plural: "Menstrual product dispensers" },
}

export const amenityTypeIcons = {
  restroom: ToiletIcon,
  waterRefillStation: DropletsIcon,
  vendingMachine: PopcornIcon,
  studySpace: BookOpenIcon,
  lactationRoom: BabyIcon,
  microwave: MicrowaveIcon,
  zeroWasteStation: RecycleIcon,
  eatery: UtensilsIcon,
  campusGarden: SproutIcon,
  basicNeedService: HeartHandshakeIcon,
  changingTable: BabyIcon,
  menstrualProduct: DropletIcon,
} satisfies Record<AmenityType, typeof ToiletIcon>

export const buildingAmenityIcons = [
  { amenityType: "restroom", label: "Restrooms available", Icon: amenityTypeIcons.restroom },
  { amenityType: "waterRefillStation", label: "Water refill stations available", Icon: amenityTypeIcons.waterRefillStation },
  { amenityType: "vendingMachine", label: "Vending machines available", Icon: amenityTypeIcons.vendingMachine },
  { amenityType: "studySpace", label: "Study spaces available", Icon: amenityTypeIcons.studySpace },
  { amenityType: "lactationRoom", label: "Lactation rooms available", Icon: amenityTypeIcons.lactationRoom },
  { amenityType: "microwave", label: "Microwaves available", Icon: amenityTypeIcons.microwave },
  { amenityType: "zeroWasteStation", label: "Zero-waste stations available", Icon: amenityTypeIcons.zeroWasteStation },
  { amenityType: "eatery", label: "Eateries available", Icon: amenityTypeIcons.eatery },
  { amenityType: "campusGarden", label: "Campus gardens available", Icon: amenityTypeIcons.campusGarden },
  { amenityType: "basicNeedService", label: "Basic needs services available", Icon: amenityTypeIcons.basicNeedService },
  { amenityType: "changingTable", label: "Changing tables available", Icon: amenityTypeIcons.changingTable },
  { amenityType: "menstrualProduct", label: "Menstrual product dispensers available", Icon: amenityTypeIcons.menstrualProduct },
] as const

export function restroomCategoryLabel(category: Restroom["category"]) {
  if (category === "women") return "Women's"
  if (category === "men") return "Men's"
  return "Gender-inclusive"
}
