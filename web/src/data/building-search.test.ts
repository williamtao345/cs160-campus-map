import { describe, expect, it } from "vitest"

import { rankSearchResults, searchBuildings } from "@/data/building-search"
import { buildings } from "@/test/amenity-fixtures"

describe("searchBuildings", () => {
  it("returns individual amenity counts with each building search result", () => {
    const [result] = searchBuildings(buildings, "Cory Hall")

    expect(result).toMatchObject({
      building: { name: "Cory Hall" },
      amenityCounts: {
        total: 14,
        restroom: 10,
        waterRefillStation: 1,
        vendingMachine: 0,
        studySpace: 0,
        lactationRoom: 0,
        microwave: 1,
        zeroWasteStation: 1,
        eatery: 1,
        campusGarden: 0,
        basicNeedService: 0,
        changingTable: 0,
        menstrualProduct: 0,
      },
    })
  })
})

describe("rankSearchResults", () => {
  it("ranks searched buildings by preference and then distance", () => {
    const origin = { latitude: 37, longitude: -122.25 }
    const preferredFar = {
      ...buildings[0],
      name: "Preferred Far Building",
      coordinates: { latitude: 37.03, longitude: -122.25 },
      restroomCategoryCounts: { women: 1, men: 0, genderInclusive: 0 },
    }
    const nonPreferredNear = {
      ...buildings[1],
      name: "Non-preferred Near Building",
      coordinates: { latitude: 37.005, longitude: -122.25 },
      restroomCategoryCounts: { women: 0, men: 1, genderInclusive: 0 },
    }
    const preferredNear = {
      ...buildings[2],
      name: "Preferred Near Building",
      coordinates: { latitude: 37.01, longitude: -122.25 },
      restroomCategoryCounts: { women: 1, men: 0, genderInclusive: 0 },
    }
    const nonPreferredFar = {
      ...buildings[3],
      name: "Non-preferred Far Building",
      coordinates: { latitude: 37.02, longitude: -122.25 },
      restroomCategoryCounts: { women: 0, men: 1, genderInclusive: 0 },
    }
    const results = searchBuildings([
      preferredFar,
      nonPreferredNear,
      preferredNear,
      nonPreferredFar,
    ], "Building")

    expect(rankSearchResults(results, "women", origin)
      .map(({ building }) => building.name))
      .toEqual([
        "Preferred Near Building",
        "Preferred Far Building",
        "Non-preferred Near Building",
        "Non-preferred Far Building",
      ])
    expect(rankSearchResults(results, null, origin)
      .map(({ building }) => building.name))
      .toEqual([
        "Non-preferred Near Building",
        "Preferred Near Building",
        "Non-preferred Far Building",
        "Preferred Far Building",
      ])
  })

  it("uses name and id as the search ranking fallback without location", () => {
    const alphaWithoutPreference = {
      ...buildings[0],
      name: "Alpha Building",
      restroomCategoryCounts: { women: 0, men: 1, genderInclusive: 0 },
    }
    const zetaWithPreference = {
      ...buildings[1],
      name: "Zeta Building",
      restroomCategoryCounts: { women: 1, men: 0, genderInclusive: 0 },
    }
    const betaWithPreference = {
      ...buildings[2],
      name: "Beta Building",
      restroomCategoryCounts: { women: 1, men: 0, genderInclusive: 0 },
    }
    const results = searchBuildings([
      zetaWithPreference,
      alphaWithoutPreference,
      betaWithPreference,
    ], "Building")

    expect(rankSearchResults(results, "women", null)
      .map(({ building }) => building.name))
      .toEqual(["Beta Building", "Zeta Building", "Alpha Building"])
  })
})
