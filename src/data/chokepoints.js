export const CHOKEPOINTS = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    nickname: 'The Oil Chokepoint',
    description: '~20% of global oil supply passes through here daily',
    importance: 'CRITICAL',
    importanceColor: '#EF4444',
    // Bounding box: lng_min, lat_min, lng_max, lat_max
    bounds: { lngMin: 56.0, latMin: 26.0, lngMax: 57.5, latMax: 27.2 },
    center: [56.75, 26.6],
    dailyOil: '21M barrels/day',
    countries: 'Iran / Oman',
    icon: '🛢️',
  },
  {
    id: 'malacca',
    name: 'Strait of Malacca',
    nickname: 'Asia\'s Lifeline',
    description: 'Busiest shipping lane — connects Indian Ocean to Pacific',
    importance: 'CRITICAL',
    importanceColor: '#EF4444',
    bounds: { lngMin: 99.5, latMin: 1.0, lngMax: 104.5, latMax: 5.5 },
    center: [102.0, 3.2],
    dailyOil: '16M barrels/day',
    countries: 'Malaysia / Singapore / Indonesia',
    icon: '⚓',
  },
  {
    id: 'suez',
    name: 'Suez Canal',
    nickname: 'Europe-Asia Shortcut',
    description: 'Connects Red Sea to Mediterranean — 12% of global trade',
    importance: 'HIGH',
    importanceColor: '#F59E0B',
    bounds: { lngMin: 32.2, latMin: 29.8, lngMax: 33.0, latMax: 31.5 },
    center: [32.6, 30.6],
    dailyOil: '5.5M barrels/day',
    countries: 'Egypt',
    icon: '🌊',
  },
  {
    id: 'bab_el_mandeb',
    name: 'Bab-el-Mandeb',
    nickname: 'Gate of Grief',
    description: 'Red Sea entrance — key route for Europe-Asia trade',
    importance: 'HIGH',
    importanceColor: '#F59E0B',
    bounds: { lngMin: 42.5, latMin: 11.5, lngMax: 44.0, latMax: 13.0 },
    center: [43.3, 12.3],
    dailyOil: '6.2M barrels/day',
    countries: 'Yemen / Djibouti',
    icon: '⚠️',
  },
  {
    id: 'dover',
    name: 'Dover Strait',
    nickname: 'English Channel Neck',
    description: 'World\'s busiest shipping lane by vessel count',
    importance: 'HIGH',
    importanceColor: '#F59E0B',
    bounds: { lngMin: 1.0, latMin: 50.5, lngMax: 2.5, latMax: 51.5 },
    center: [1.75, 51.0],
    dailyOil: '2.4M barrels/day',
    countries: 'UK / France',
    icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  },
  {
    id: 'cape_good_hope',
    name: 'Cape of Good Hope',
    nickname: 'Suez Alternative',
    description: 'Used when Suez is blocked — adds 2 weeks to voyage',
    importance: 'MEDIUM',
    importanceColor: '#3B82F6',
    bounds: { lngMin: 17.5, latMin: -35.5, lngMax: 19.5, latMax: -33.5 },
    center: [18.5, -34.5],
    dailyOil: '4.1M barrels/day',
    countries: 'South Africa',
    icon: '🌍',
  },
  {
    id: 'taiwan_strait',
    name: 'Taiwan Strait',
    nickname: 'Tech Supply Chain',
    description: 'Major container route — geopolitical flashpoint',
    importance: 'HIGH',
    importanceColor: '#F59E0B',
    bounds: { lngMin: 119.5, latMin: 22.0, lngMax: 121.5, latMax: 26.0 },
    center: [120.5, 24.0],
    dailyOil: '1.2M barrels/day',
    countries: 'China / Taiwan',
    icon: '📦',
  },
  {
    id: 'panama',
    name: 'Panama Canal',
    nickname: 'Americas Bridge',
    description: 'Connects Atlantic and Pacific — drought restricted in 2023',
    importance: 'HIGH',
    importanceColor: '#F59E0B',
    bounds: { lngMin: -80.0, latMin: 8.5, lngMax: -79.0, latMax: 9.5 },
    center: [-79.5, 9.0],
    dailyOil: '0.8M barrels/day',
    countries: 'Panama',
    icon: '🔒',
  },
];

export function detectChokepoints(vessel, position) {
  const triggered = [];
  for (const cp of CHOKEPOINTS) {
    const { lngMin, latMin, lngMax, latMax } = cp.bounds;
    if (position.lng >= lngMin && position.lng <= lngMax &&
        position.lat >= latMin && position.lat <= latMax) {
      triggered.push(cp);
    }
  }
  return triggered;
}
