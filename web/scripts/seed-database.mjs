import { readFile } from "node:fs/promises"
import process from "node:process"

import { applicationDefault, getApps, initializeApp } from "firebase-admin/app"
import { getDatabase } from "firebase-admin/database"

const dataDirectory = new URL("../src/data/", import.meta.url)
const amenitySources = [
  ["restrooms.json", "restroom", "restrooms"],
  ["water-refill-stations.json", "waterRefillStation", "waterRefillStations"],
  ["vending-machines.json", "vendingMachine", "vendingMachines"],
  ["study-spaces.json", "studySpace", "studySpaces"],
  ["lactation-rooms.json", "lactationRoom", "lactationRooms"],
  ["microwaves.json", "microwave", "microwaves"],
  ["zero-waste-stations.json", "zeroWasteStation", "zeroWasteStations"],
  ["eateries.json", "eatery", "eateries"],
  ["campus-gardens.json", "campusGarden", "campusGardens"],
  ["basic-needs-services.json", "basicNeedService", "basicNeedServices"],
  ["changing-tables.json", "changingTable", "changingTables"],
  ["menstrual-products.json", "menstrualProduct", "menstrualProducts"],
]

async function readJson(fileName) {
  return JSON.parse(await readFile(new URL(fileName, dataDirectory), "utf8"))
}

const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT
const databaseURL = process.env.FIREBASE_DATABASE_URL
if (!projectId) throw new Error("Set FIREBASE_PROJECT_ID before seeding Firebase.")
if (!databaseURL) throw new Error("Set FIREBASE_DATABASE_URL before seeding Firebase.")

const buildingRecords = await readJson("buildings.json")
const sourceAmenities = (await Promise.all(amenitySources.map(async ([fileName, amenityType, branch]) => (
  (await readJson(fileName)).map((amenity) => ({ ...amenity, amenityType, branch }))
)))).flat()

const amenitiesByBuilding = {}
const amenityCounters = new Map()
const amenities = sourceAmenities.map(({ branch, ...amenity }) => {
  const counterKey = `${amenity.buildingId}:${amenity.amenityType}`
  const sequence = (amenityCounters.get(counterKey) ?? 0) + 1
  amenityCounters.set(counterKey, sequence)
  const seededAmenity = {
    ...amenity,
    id: `${amenity.amenityType}_${sequence}`,
    sourceId: amenity.id,
  }

  amenitiesByBuilding[amenity.buildingId] ??= {}
  amenitiesByBuilding[amenity.buildingId][branch] ??= {}
  amenitiesByBuilding[amenity.buildingId][branch][seededAmenity.id] = seededAmenity
  return seededAmenity
})

const buildings = {}
for (const building of buildingRecords) {
  const buildingAmenities = Object.values(amenitiesByBuilding[building.id] ?? {}).flatMap((branch) => Object.values(branch))
  const amenityCounts = { total: buildingAmenities.length }
  for (const [, amenityType] of amenitySources) {
    amenityCounts[amenityType] = buildingAmenities.filter((amenity) => amenity.amenityType === amenityType).length
  }
  const availableAmenityTypes = amenitySources
    .map(([, amenityType]) => amenityType)
    .filter((amenityType) => buildingAmenities.some((amenity) => amenity.amenityType === amenityType))

  buildings[`building_${building.id}`] = { ...building, amenityCounts, availableAmenityTypes }
}

if (process.env.FIREBASE_ACCESS_TOKEN) {
  const url = new URL(".json", `${databaseURL.replace(/\/$/, "")}/`)
  url.searchParams.set("access_token", process.env.FIREBASE_ACCESS_TOKEN)
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ buildings, amenitiesByBuilding }),
  })
  if (!response.ok) throw new Error(`Firebase seed failed (${response.status}): ${await response.text()}`)
} else {
  const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), databaseURL, projectId })
  const database = getDatabase(app)
  await database.ref().update({ buildings, amenitiesByBuilding })
}

console.log(`Seeded ${buildingRecords.length} buildings and ${amenities.length} amenities into ${projectId}.`)
