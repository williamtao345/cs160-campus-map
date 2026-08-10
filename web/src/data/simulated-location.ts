export type SimulatedLocation = {
  accuracy: number
  latitude: number
  longitude: number
}

// Returns null so the app tracks the real device position with navigator.geolocation. Return a fixed position instead to demo the app away from campus; Soda Hall is { accuracy: 10, latitude: 37.87564567934229, longitude: -122.25872258719399 }.
export function simulatedUserLocation(): SimulatedLocation | null {
  return null
}
