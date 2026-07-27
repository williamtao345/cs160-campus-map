import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getDatabase, type Database } from "firebase/database"

let firebaseApp: FirebaseApp | undefined
let database: Database | undefined

export function getFirebaseApp() {
  if (firebaseApp) return firebaseApp

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  }
  const missingFields = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missingFields.length > 0) {
    throw new Error(`Firebase is not configured. Missing: ${missingFields.join(", ")}`)
  }

  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(config)
  return firebaseApp
}

export function getFirebaseDatabase() {
  if (database) return database

  database = getDatabase(getFirebaseApp())
  return database
}
