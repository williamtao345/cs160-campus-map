# CS160 Team Project

A mobile campus amenity map that helps UC Berkeley students quickly find nearby restrooms, water refill stations, vending machines, study spaces, food, and other useful resources.

## Features

- Browse campus amenities by type and building
- Compare hours, accessibility, ratings, and availability
- View building, floor, and indoor location details
- Share reviews, photos, and issue reports to keep information accurate

## Run locally

Install the frontend dependencies:

```sh
cd web
npm install
```

Create the ignored environment file and add a browser-restricted Google Maps JavaScript API key:

```sh
cp .env.example .env
```

Start the Vite development server:

```sh
npm run dev
```

The development server always uses port `5173`. When developing in WSL, open the displayed Local URL in the Windows browser. If Windows localhost forwarding is disabled, use the displayed Network URL and add that exact origin to the API key's website restrictions. Run `hostname -I` in WSL to find the current address; it can change after WSL restarts.

## Deploy

The GitHub Pages workflow tests, builds, and publishes `web/dist/` when changes reach `main`. Add the API key as a repository Actions secret named `GOOGLE_MAPS_API_KEY` and configure Pages to use GitHub Actions. Deployment fails instead of publishing a map without a key when the secret is absent.

The Maps JavaScript API key is included in the browser bundle by design. Protect it with an HTTP referrer restriction, restrict it to the Maps JavaScript API, and configure an appropriate usage quota. Use these website referrers:

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
