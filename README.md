# CS160 Team Project

A mobile campus amenity map that helps UC Berkeley students quickly find nearby restrooms, water refill stations, vending machines, study spaces, food, and other useful resources.

## Features

- Browse campus amenities by type and building
- Compare hours, accessibility, ratings, and availability
- View building, floor, and indoor location details
- Share reviews, photos, and issue reports to keep information accurate

## Run locally

Install the frontend dependencies exactly from the lockfile:

```sh
cd web
npm ci
```

Create the ignored environment file. Add a browser-restricted Google Maps JavaScript API key and the Firebase web app configuration from Firebase Console:

```sh
cp .env.example .env
```

Start the Vite development server:

```sh
npm run dev
```

The application reads `/buildings` when it starts and reads `/amenitiesByBuilding/{buildingId}` when a building is opened. Building records use non-numeric keys such as `building_200`, while retaining their numeric `id` field. Amenities within a building are grouped under `restrooms`, `waterRefillStations`, `vendingMachines`, and `studySpaces`. If Firebase is not configured, the app displays a setup error instead of making a request.

## Set up Google sign-in

In Firebase Console, open **Authentication**, select **Sign-in method**, and enable the Google provider. Then add these hostnames under **Authentication > Settings > Authorized domains**:

- `localhost`
- `127.0.0.1`
- `williamtao345.github.io`

The browser signs users in directly through Firebase Authentication and Google. Firebase configuration values in `.env` are public project identifiers, not administrator credentials. The app uses Firebase's local authentication persistence, so a session remains available after a reload until the user explicitly signs out.

Authentication currently identifies the user only. Amenity submissions remain disabled, and Realtime Database rules continue to deny all browser writes.

## Set up Realtime Database

Create a Firebase project and a Realtime Database. Deploy the repository's read-only rules from the repository root:

```sh
firebase use YOUR_PROJECT_ID
firebase deploy --only database
```

Seed the existing campus data using Application Default Credentials:

```sh
gcloud auth application-default login
cd web
FIREBASE_PROJECT_ID=YOUR_PROJECT_ID FIREBASE_DATABASE_URL=https://YOUR_PROJECT-default-rtdb.firebaseio.com npm run seed:database
```

Alternatively, an existing Google Cloud CLI login can provide a short-lived token:

```sh
FIREBASE_PROJECT_ID=YOUR_PROJECT_ID FIREBASE_DATABASE_URL=https://YOUR_PROJECT-default-rtdb.firebaseio.com FIREBASE_ACCESS_TOKEN="$(gcloud auth print-access-token)" npm run seed:database
```

The seed is idempotent and replaces only the `/buildings` and `/amenitiesByBuilding` nodes. The deployed rules permit public reads of those nodes and deny every client write. The Admin SDK or Google Cloud access token used by the seed script authenticates outside those client rules.

The development server always uses port `5173`. When developing in WSL, open the displayed Local URL in the Windows browser. If Windows localhost forwarding is disabled, use the displayed Network URL and add that exact origin to the API key's website restrictions. Run `hostname -I` in WSL to find the current address; it can change after WSL restarts.

## Deploy

The GitHub Pages workflow tests, builds, and publishes `web/dist/` when changes reach `main`. Add the Maps API key as a repository Actions secret named `GOOGLE_MAPS_API_KEY`. Add the Firebase web configuration as repository Actions variables named `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, and `FIREBASE_DATABASE_URL`. Configure Pages to use GitHub Actions. Deployment fails if any required value is absent.

The Maps and Firebase web API keys are included in the browser bundle by design. Realtime Database access is protected by `database.rules.json`; protect the Maps key with an HTTP referrer restriction, restrict it to the Maps JavaScript API, and configure an appropriate usage quota. Use these website referrers:

- `http://localhost:5173/*`
- `http://127.0.0.1:5173/*`
- `http://<current-wsl-ip>:5173/*` when using the WSL Network URL
- `https://williamtao345.github.io/cs160-campus-map/*`

## Verify

Run the test suite and production build from `web/`:

```sh
npm test
npm run build
```
