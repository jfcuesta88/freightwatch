// Vercel serverless function — proxies Data Docked vessel API to avoid browser CORS restrictions
// Server-to-server calls are never blocked by CORS, only browser-to-server calls are

const SHIPPING_ZONES = [
  { lat: 1.3, lng: 103.8, radius: 50 },  // Singapore Strait — busiest shipping lane globally
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60'); // cache 60s to conserve API credits

  const apiKey = process.env.REACT_APP_DATADOCKED_KEY || req.query.key;

  if (!apiKey) {
    return res.status(400).json({ error: 'Missing Data Docked API key' });
  }

  try {
    const allVessels = [];
    const seen = new Set();

    for (const zone of SHIPPING_ZONES) {
      try {
        const url = `https://datadocked.com/api/vessels_operations/get-vessels-by-area?latitude=${zone.lat}&longitude=${zone.lng}&circle_radius=${zone.radius}`;
        const response = await fetch(url, {
          headers: { 'accept': 'application/json', 'x-api-key': apiKey }
        });
        if (!response.ok) continue;
        const data = await response.json();
        const arr = Array.isArray(data) ? data : (data.vessels || data.data || []);
        for (const v of arr) {
          if (v.mmsi && !seen.has(v.mmsi)) {
            seen.add(v.mmsi);
            allVessels.push(v);
          }
        }
      } catch (e) {
        // skip zone on individual failure, continue with others
      }
    }

    return res.status(200).json({ vessels: allVessels, count: allVessels.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
