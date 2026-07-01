# MarineWatch 🛳️

Real-time global vessel tracking for oil tankers, cargo ships, container vessels, LNG carriers, and naval frigates.

## Features

- Live animated vessel positions on a world map
- Filter by vessel type (tanker, cargo, container, LNG, naval)
- Search by vessel name, flag, IMO number, or cargo
- Click any vessel for full detail panel (speed, heading, destination, cargo, dimensions)
- Real-time zone entry alerts
- Clean dark maritime UI

## Quick start (local dev)

```bash
npm install
npm start
```

Opens at http://localhost:3000

## Deploy to Vercel (1 command)

```bash
npm install -g vercel
vercel
```

Done. Your app is live at a `*.vercel.app` URL in about 60 seconds.

## Connect real AIS data (MarineTraffic API)

1. Sign up at https://www.marinetraffic.com/en/ais-api-services
2. Get your API key
3. Replace the simulation in `src/hooks/useVessels.js` with:

```js
const fetchVessels = async () => {
  const res = await fetch(
    `https://services.marinetraffic.com/api/getvessel/v:8/${YOUR_API_KEY}/protocol:jsono`
  );
  const data = await res.json();
  // map data to vessel format
};
```

## Project structure

```
src/
  components/
    Sidebar.jsx        — vessel list, search, filters, alerts tab
    MapCanvas.jsx      — canvas-based world map with vessel dots
    VesselDetail.jsx   — detail panel when vessel is selected
    StatsBar.jsx       — fleet count summary at top of map
  hooks/
    useVessels.js      — position simulation, filtering, search logic
  data/
    vessels.js         — vessel data + type definitions
  App.jsx              — root layout
```

## Monetization options

- **Freemium**: free basic map, paid alerts + history + export
- **B2B**: per-seat subscription for shipping ops teams ($20–50/mo)
- **Data API**: resell filtered vessel data to researchers

## Next features to build

- [ ] Route history / playback
- [ ] Custom alert zones (draw on map)
- [ ] Port arrival ETA predictions
- [ ] Export to CSV / PDF
- [ ] User accounts + saved vessel watchlists
- [ ] Mapbox integration for proper map tiles
