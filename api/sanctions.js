// Vercel serverless function — fetches OFAC SDN list from US Treasury
// Free, no API key, updates every 24 hours automatically

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400');

  try {
    const response = await fetch('https://www.treasury.gov/ofac/downloads/sdn.xml', {
      headers: { 'User-Agent': 'FreightWatch/1.0' }
    });
    if (!response.ok) throw new Error(`Treasury error: ${response.status}`);
    const xml = await response.text();

    const vessels = [];
    const entryRegex = /<sdnEntry>([\s\S]*?)<\/sdnEntry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const sdnType = (entry.match(/<sdnType>(.*?)<\/sdnType>/) || [])[1];
      if (sdnType !== 'Vessel') continue;
      const name = (entry.match(/<lastName>(.*?)<\/lastName>/) || [])[1] || '';
      const uid  = (entry.match(/<uid>(.*?)<\/uid>/) || [])[1] || '';
      const programs = [...entry.matchAll(/<program>(.*?)<\/program>/g)].map(m => m[1]);
      const imoMatch = entry.match(/IMO\s*(\d+)/i);
      const flagMatch = entry.match(/<nationality>(.*?)<\/nationality>/);
      vessels.push({
        uid, name,
        imo: imoMatch ? `IMO${imoMatch[1]}` : null,
        flag: flagMatch ? flagMatch[1] : null,
        programs,
        reason: programs.join(', '),
        list: 'OFAC SDN',
      });
    }

    res.json({ count: vessels.length, updated: new Date().toISOString(), vessels });
  } catch (err) {
    res.status(200).json({ count: 0, error: err.message, fallback: true, vessels: [] });
  }
}
