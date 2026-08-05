import { beforeEach, describe, expect, it, vi } from "vitest"

import { loadAmenitiesForBuilding, loadBuildings, type Building } from "@/data/amenities"

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }))

vi.mock("firebase/database", () => ({
  get: getMock,
  ref: vi.fn(),
}))

vi.mock("@/lib/firebase", () => ({
  getFirebaseDatabase: vi.fn(() => ({})),
}))

const building = {
  id: 200,
  gisId: 238,
  caan: "1144",
  name: "1893 Le Roy Avenue",
  shortName: "1893 Le Roy Ave.",
  coordinates: {
    latitude: 37.87568816253602,
    longitude: -122.25819384743761,
  },
  amenityCounts: {
    total: 0,
    restroom: 0,
    waterRefillStation: 0,
    vendingMachine: 0,
    studySpace: 0,
    lactationRoom: 0,
    microwave: 0,
    zeroWasteStation: 0,
    eatery: 0,
    campusGarden: 0,
    basicNeedService: 0,
    changingTable: 0,
    menstrualProduct: 0,
  },
  restroomCategoryCounts: {
    women: 0,
    men: 0,
    genderInclusive: 0,
  },
  availableAmenityTypes: [],
}

describe("loadBuildings", () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it("loads buildings stored under prefixed keys", async () => {
    getMock.mockResolvedValue({ val: () => ({ building_200: building }) })

    await expect(loadBuildings()).resolves.toEqual([building])
  })

  it("loads existing building records before restroom category counts are reseeded", async () => {
    const { restroomCategoryCounts: _restroomCategoryCounts, ...existingBuilding } = building
    void _restroomCategoryCounts
    getMock.mockResolvedValue({ val: () => ({ building_200: existingBuilding }) })

    await expect(loadBuildings()).resolves.toEqual([building])
  })

  it("rejects a key that does not match the building id", async () => {
    getMock.mockResolvedValue({ val: () => ({ building_201: building }) })

    await expect(loadBuildings()).rejects.toThrow("Invalid key for building building_201")
  })
})

describe("loadAmenitiesForBuilding", () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it("loads amenities whose keys match their ids", async () => {
    const restroom = {
      id: "restroom_1",
      buildingId: 200,
      amenityType: "restroom",
      floorNumber: "1",
      roomNumber: "101",
      isAvailable: true,
      category: "genderInclusive",
      accessible: true,
      stallType: "single",
      restrictedAccess: false,
      sourceText: "Room 101",
    }
    getMock.mockResolvedValue({ val: () => ({ restrooms: { restroom_1: restroom } }) })

    await expect(loadAmenitiesForBuilding(building as Building)).resolves.toEqual([
      { ...restroom, building },
    ])
  })

  it("loads the room number of a general amenity", async () => {
    const microwave = {
      id: "microwave_1",
      buildingId: 200,
      amenityType: "microwave",
      floorNumber: "B",
      roomNumber: "602",
      locationDetails: "Davis Hall Microwave",
      isAvailable: true,
      accessible: null,
      operatingHours: null,
      rating: null,
      notes: "In room 602",
    }
    getMock.mockResolvedValue({ val: () => ({ microwaves: { microwave_1: microwave } }) })

    await expect(loadAmenitiesForBuilding(building as Building)).resolves.toEqual([
      { ...microwave, building },
    ])
  })

  it("defaults a general amenity to no room number when the field is absent", async () => {
    const eatery = {
      id: "eatery_1",
      buildingId: 200,
      amenityType: "eatery",
      floorNumber: null,
      locationDetails: null,
      isAvailable: true,
      accessible: null,
      operatingHours: null,
      rating: null,
      notes: null,
    }
    getMock.mockResolvedValue({ val: () => ({ eateries: { eatery_1: eatery } }) })

    await expect(loadAmenitiesForBuilding(building as Building)).resolves.toEqual([
      { ...eatery, roomNumber: null, building },
    ])
  })

  it("rejects a key that does not match the amenity id", async () => {
    getMock.mockResolvedValue({
      val: () => ({
        restrooms: {
          restroom_2: {
            id: "restroom_1",
            buildingId: 200,
            amenityType: "restroom",
            floorNumber: "1",
            roomNumber: "101",
            isAvailable: true,
            category: "genderInclusive",
            accessible: true,
            stallType: "single",
            restrictedAccess: false,
            sourceText: "Room 101",
          },
        },
      }),
    })

    await expect(loadAmenitiesForBuilding(building as Building)).rejects.toThrow(
      "Invalid key for amenity restroom_2",
    )
  })
})
