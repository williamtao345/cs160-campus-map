export type SimulatedLocation = {
  accuracy: number
  latitude: number
  longitude: number
}

// Pins the user to Soda Hall so the app can be demoed away from campus. Return null to track the real device position with navigator.geolocation.
export function simulatedUserLocation(): SimulatedLocation | null {
  return { accuracy: 10, latitude: 37.87564567934229, longitude: -122.25872258719399 }
}
