// Maps both AISHub and MarineTraffic API formats to our internal vessel format

const FLAG_MAP = {
  'MH':'Marshall Islands','GR':'Greece','PA':'Panama','LR':'Liberia',
  'BS':'Bahamas','MT':'Malta','CY':'Cyprus','SG':'Singapore',
  'HK':'Hong Kong','CN':'China','JP':'Japan','NO':'Norway',
  'GB':'UK','US':'USA','DE':'Germany','DK':'Denmark',
  'FR':'France','IT':'Italy','KR':'South Korea','IN':'India',
  'SA':'Saudi Arabia','AE':'UAE','BR':'Brazil','PH':'Philippines',
  'TW':'Taiwan','SE':'Sweden','NL':'Netherlands','BE':'Belgium',
  'RU':'Russia','AU':'Australia','CA':'Canada','MX':'Mexico',
};

// AISHub ship type codes
const AISHUB_TYPE_MAP = {
  80:'tanker', 81:'tanker', 82:'tanker', 83:'tanker', 84:'tanker',
  85:'tanker', 86:'tanker', 87:'tanker', 88:'tanker', 89:'tanker',
  70:'container', 71:'container', 72:'container', 73:'container', 74:'container',
  79:'container',
  72:'bulk', 73:'bulk', 74:'bulk', 75:'bulk', 76:'bulk', 77:'bulk', 78:'bulk',
};

function mapTypeCode(typeCode) {
  const code = parseInt(typeCode);
  if (code >= 80 && code <= 89) return 'tanker';
  if (code >= 70 && code <= 79) return 'container';
  if (code >= 72 && code <= 78) return 'bulk';
  if (code === 69) return 'chemical';
  return 'cargo';
}

function estimateCargo(draughtRaw, type, dwt) {
  // AISHub sends draught in metres * 10 (e.g. 95 = 9.5m)
  const draughtM = parseFloat(draughtRaw) / 10;
  const maxDraughtMap = { vlcc:22.5, tanker:15.0, lng:12.5, lpg:9.0, bulk:18.0, container:16.0, chemical:10.5, cargo:12.0 };
  const loadFactor = Math.min(draughtM / (maxDraughtMap[type] || 12), 1.0);
  const cargoMap = {
    vlcc:      { cargo:'Crude oil',              unit:'barrels', price:82,   capacity:2000000 },
    tanker:    { cargo:'Crude / fuel oil',        unit:'barrels', price:80,   capacity:700000 },
    lng:       { cargo:'Liquefied natural gas',   unit:'MMBtu',   price:9.2,  capacity:150000 },
    lpg:       { cargo:'Liquefied petroleum gas', unit:'tonnes',  price:580,  capacity:25000 },
    bulk:      { cargo:'Iron ore',                unit:'tonnes',  price:108,  capacity:Math.round((parseFloat(dwt)||80000)*0.9) },
    container: { cargo:'Mixed containers',        unit:'TEU',     price:2200, capacity:10000 },
    chemical:  { cargo:'Chemicals',               unit:'tonnes',  price:420,  capacity:20000 },
    cargo:     { cargo:'General cargo',           unit:'tonnes',  price:150,  capacity:30000 },
  };
  const cm = cargoMap[type] || cargoMap.cargo;
  const estimatedUnits = Math.round(cm.capacity * Math.max(loadFactor, 0));
  return {
    loadFactor: Math.round(loadFactor * 100),
    loaded: loadFactor > 0.7,
    partial: loadFactor > 0.4 && loadFactor <= 0.7,
    status: loadFactor > 0.7 ? 'Laden' : loadFactor > 0.4 ? 'Partial load' : 'Ballast (empty)',
    estimatedUnits,
    estimatedValue: estimatedUnits * cm.price,
    unit: cm.unit,
    cargo: cm.cargo,
    icon: {vlcc:'🛢️',tanker:'🛢️',lng:'🔵',lpg:'🟡',bulk:'⚙️',container:'📦',chemical:'⚗️',cargo:'🚢'}[type]||'🚢',
  };
}

// ── AISHub format ──────────────────────────────────────────────────
// Fields: MMSI, TIME/TSTAMP, LATITUDE/LAT, LONGITUDE/LON,
//         COG, SOG, HEADING, NAVSTAT, IMO, NAME, CALLSIGN,
//         TYPE, A, B, C, D, DRAUG/DRAU, DEST, ETA
export function mapAISHubVessel(v, index) {
  const lat = parseFloat(v.LATITUDE ?? v.LAT);
  const lng = parseFloat(v.LONGITUDE ?? v.LON);
  if (isNaN(lat) || isNaN(lng)) return null;

  const type = mapTypeCode(v.TYPE);
  const draught = v.DRAUGHT ?? v.DRAU ?? v.D ?? '0';
  const cargoEstimate = estimateCargo(draught, type, v.DWT);
  const length = (parseFloat(v.A||0) + parseFloat(v.B||0)) || null;
  const width  = (parseFloat(v.C||0) + parseFloat(v.D||0)) || null;
  const flag = FLAG_MAP[v.FLAG] || v.FLAG || 'Unknown';

  return {
    id: String(v.MMSI || index),
    name: (v.NAME || v.SHIPNAME || 'Unknown').trim(),
    type,
    lat, lng,
    speed: parseFloat(v.SOG ?? v.SPEED ?? 0) / 10,
    heading: parseInt(v.HEADING || v.COG || 0),
    flag,
    imo: v.IMO ? `IMO${v.IMO}` : String(v.MMSI),
    mmsi: String(v.MMSI),
    draught: `${(parseFloat(draught)/10).toFixed(1)}m`,
    dest: (v.DESTINATION ?? v.DEST ?? 'Unknown').trim() || 'Unknown',
    cargo: cargoEstimate.cargo,
    capacity: cargoEstimate.estimatedUnits,
    length: length ? `${length}m` : '—',
    width: width ? `${width}m` : '—',
    built: v.YEAR_BUILT || '—',
    callsign: v.CALLSIGN || '—',
    typeName: v.TYPE_NAME || `Type ${v.TYPE}`,
    timestamp: v.TIME ? new Date(parseInt(v.TIME)*1000).toISOString() : (v.TSTAMP || v.TIMESTAMP),
    route: `→ ${(v.DESTINATION ?? v.DEST ?? 'Unknown').trim() || 'Unknown'}`,
    cargoEstimate,
    source: 'aishub',
  };
}

// ── MarineTraffic format ───────────────────────────────────────────
export function mapMTVessel(v, index) {
  const type = (() => {
    const n = (v.TYPE_NAME||'').toLowerCase();
    const s = (v.AIS_TYPE_SUMMARY||'').toLowerCase();
    if (n.includes('crude') || (v.SHIP_CLASS||'').includes('VLCC')) return 'vlcc';
    if (n.includes('lng')) return 'lng';
    if (n.includes('lpg')) return 'lpg';
    if (n.includes('chemical')) return 'chemical';
    if (n.includes('tanker') || s === 'tanker') return 'tanker';
    if (n.includes('bulk') || n.includes('ore')) return 'bulk';
    if (n.includes('container') || s === 'container') return 'container';
    return 'cargo';
  })();

  const cargoEstimate = estimateCargo(v.DRAUGHT, type, v.DWT);

  return {
    id: String(v.MMSI || index),
    name: (v.SHIPNAME || 'Unknown').trim(),
    type,
    lat: parseFloat(v.LAT),
    lng: parseFloat(v.LON),
    speed: parseFloat(v.SPEED) / 10,
    heading: parseInt(v.HEADING || v.COURSE || 0),
    flag: FLAG_MAP[v.FLAG] || v.SHIP_COUNTRY || v.FLAG || 'Unknown',
    imo: v.IMO ? `IMO${v.IMO}` : String(v.MMSI),
    mmsi: String(v.MMSI),
    draught: `${(parseFloat(v.DRAUGHT)/10).toFixed(1)}m`,
    dest: (v.DESTINATION||'Unknown').trim(),
    cargo: cargoEstimate.cargo,
    capacity: cargoEstimate.estimatedUnits,
    length: `${v.LENGTH||'?'}m`,
    built: v.YEAR_BUILT || '—',
    callsign: v.CALLSIGN || '—',
    shipClass: v.SHIP_CLASS,
    lastPort: v.LAST_PORT,
    lastPortCountry: FLAG_MAP[v.LAST_PORT_COUNTRY] || v.LAST_PORT_COUNTRY,
    currentPort: v.CURRENT_PORT || null,
    eta: v.ETA_CALC || v.ETA,
    avgSpeed: v.AVG_SPEED,
    timestamp: v.TIMESTAMP,
    route: v.LAST_PORT ? `${v.LAST_PORT} → ${v.DESTINATION||'Unknown'}` : `→ ${v.DESTINATION||'Unknown'}`,
    cargoEstimate,
    source: 'marinetraffic',
  };
}

// ── Data Docked format ─────────────────────────────────────────────
// Fields: mmsi, name, latitude, longitude, speed, course, heading
export function mapDataDockedVessel(v, index) {
  const lat = parseFloat(v.latitude);
  const lng = parseFloat(v.longitude);
  if (isNaN(lat) || isNaN(lng)) return null;

  // Data Docked doesn't return vessel type in the area endpoint — infer from name patterns, default to cargo
  const name = (v.name || 'Unknown').trim();
  let type = 'bulk';
  const n = name.toLowerCase();
  if (n.includes('tanker') || n.includes('lng') || n.includes('lpg') || n.includes('vlcc')) type = 'tanker';
  if (n.includes('lng')) type = 'lng';
  if (n.includes('lpg')) type = 'lpg';
  if (n.includes('bulk') || n.includes('ore')) type = 'bulk';
  if (n.includes('container') || n.includes('msc') || n.includes('maersk') || n.includes('cosco') || n.includes('cma cgm')) type = 'container';

  const cargoEstimate = estimateCargo('100', type, null);

  return {
    id: String(v.mmsi || index),
    name,
    type,
    lat, lng,
    speed: parseFloat(v.speed || 0) / 10,
    heading: parseInt(v.heading || v.course || 0),
    flag: 'Unknown',
    imo: v.imo ? `IMO${v.imo}` : String(v.mmsi),
    mmsi: String(v.mmsi),
    draught: '—',
    dest: 'Unknown',
    cargo: cargoEstimate.cargo,
    capacity: cargoEstimate.estimatedUnits,
    length: '—',
    built: '—',
    callsign: '—',
    typeName: 'Vessel',
    timestamp: new Date().toISOString(),
    route: '→ Unknown',
    cargoEstimate,
    source: 'datadocked',
  };
}

export function mapAISResponse(data, source = 'auto') {
  if (!Array.isArray(data)) return [];
  return data
    .map((v, i) => {
      if (source === 'datadocked' || 'mmsi' in v) return mapDataDockedVessel(v, i);
      // Auto-detect format by field names
      const isAISHub = 'SOG' in v || 'NAME' in v || 'TSTAMP' in v || 'TIME' in v;
      return isAISHub ? mapAISHubVessel(v, i) : mapMTVessel(v, i);
    })
    .filter(v => v && !isNaN(v.lat) && !isNaN(v.lng) && v.lat !== 0);
}
