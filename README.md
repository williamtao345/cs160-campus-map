# CS160 Team Project

A mobile campus amenity map that helps UC Berkeley students quickly find nearby restrooms, water refill stations, vending machines, study spaces, food, and other useful resources.

## Features

- Search by amenity type or building
- Compare hours, accessibility, ratings, and availability
- View building, floor, and indoor location details
- Share reviews, photos, and issue reports to keep information accurate

## Run locally

Create the ignored runtime configuration file and add a browser-restricted Google Maps JavaScript API key:

```sh
cp web/config.example.js web/config.js
```

Serve the `web` directory over HTTP, then open the local URL in a browser:

```sh
python3 -m http.server 8000 --directory web
```

## Deploy

The GitHub Pages workflow publishes `web/` when changes reach `main`. Add the API key as a repository Actions secret named `GOOGLE_MAPS_API_KEY` and configure Pages to use GitHub Actions.

Restrict the browser key to the Maps JavaScript API and these website referrers:

- `http://localhost:*/*`
- `http://127.0.0.1:*/*`
- `https://williamtao345.github.io/cs160-campus-map/*`
