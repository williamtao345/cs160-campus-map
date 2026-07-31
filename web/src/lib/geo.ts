export type Coordinates = {
  latitude: number
  longitude: number
}

const earthRadiusMiles = 3_958.8

export function distanceInMiles(first: Coordinates, second: Coordinates) {
  const radians = Math.PI / 180
  const latitudeDelta = (second.latitude - first.latitude) * radians
  const longitudeDelta = (second.longitude - first.longitude) * radians
  const firstLatitude = first.latitude * radians
  const secondLatitude = second.latitude * radians
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2

  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}
