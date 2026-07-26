export type Amenity = {
  id: number
  type: string
  building: string
  floor: number
  locationDetails: string
  hours: string
  accessibility: string
  rating: number
  availability: "Available" | "Out of service" | "Unknown"
  notes: string
  lastReported: string
}

export const amenities: Amenity[] = [
  { id: 1, type: "Restroom", building: "Soda Hall", floor: 1, locationDetails: "", hours: "7:00 AM-10:00 PM", accessibility: "Accessible", rating: 4.4, availability: "Available", notes: "", lastReported: "10 minutes ago" },
  { id: 2, type: "Water refill station", building: "Soda Hall", floor: 3, locationDetails: "", hours: "7:00 AM-10:00 PM", accessibility: "Accessible", rating: 4.7, availability: "Available", notes: "", lastReported: "25 minutes ago" },
  { id: 3, type: "Study space", building: "Soda Hall", floor: 4, locationDetails: "", hours: "8:00 AM-9:00 PM", accessibility: "Accessible", rating: 4.5, availability: "Out of service", notes: "", lastReported: "5 minutes ago" },
  { id: 4, type: "Vending machine", building: "Cory Hall", floor: 2, locationDetails: "", hours: "7:30 AM-9:00 PM", accessibility: "Accessible", rating: 4.0, availability: "Available", notes: "", lastReported: "1 hour ago" },
  { id: 5, type: "Restroom", building: "Cory Hall", floor: 1, locationDetails: "", hours: "7:30 AM-9:00 PM", accessibility: "Accessible", rating: 4.1, availability: "Available", notes: "", lastReported: "20 minutes ago" },
  { id: 6, type: "Study space", building: "GSPP", floor: 1, locationDetails: "", hours: "8:00 AM-8:00 PM", accessibility: "Accessible", rating: 4.6, availability: "Available", notes: "", lastReported: "15 minutes ago" },
  { id: 7, type: "Water refill station", building: "GSPP", floor: 1, locationDetails: "", hours: "8:00 AM-8:00 PM", accessibility: "Accessible", rating: 4.8, availability: "Available", notes: "", lastReported: "30 minutes ago" },
  { id: 8, type: "Food", building: "Sutardja Dai Hall", floor: 1, locationDetails: "", hours: "8:00 AM-5:00 PM", accessibility: "Accessible", rating: 4.2, availability: "Available", notes: "", lastReported: "10 minutes ago" },
  { id: 9, type: "Restroom", building: "Sutardja Dai Hall", floor: 3, locationDetails: "", hours: "7:00 AM-9:00 PM", accessibility: "Accessible", rating: 4.5, availability: "Out of service", notes: "", lastReported: "12 minutes ago" },
  { id: 10, type: "Study space", building: "Sutardja Dai Hall", floor: 4, locationDetails: "", hours: "7:00 AM-9:00 PM", accessibility: "Accessible", rating: 4.4, availability: "Available", notes: "", lastReported: "8 minutes ago" },
]
