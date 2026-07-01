export const VESSEL_TYPES = {
  vlcc:      { label: 'VLCC Tanker',     color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  commodity: 'Crude oil' },
  tanker:    { label: 'Oil Tanker',      color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   commodity: 'Crude / fuel oil' },
  lng:       { label: 'LNG Carrier',     color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)',  commodity: 'Liquefied natural gas' },
  lpg:       { label: 'LPG Carrier',     color: '#06B6D4', bg: 'rgba(6,182,212,0.15)',   commodity: 'Liquefied petroleum gas' },
  bulk:      { label: 'Bulk Carrier',    color: '#10B981', bg: 'rgba(16,185,129,0.15)',  commodity: 'Dry bulk' },
  container: { label: 'Container Ship',  color: '#3B82F6', bg: 'rgba(59,130,246,0.15)',  commodity: 'Mixed containers' },
  chemical:  { label: 'Chemical Tanker', color: '#F97316', bg: 'rgba(249,115,22,0.15)', commodity: 'Chemicals' },
};

export const COMMODITIES = {
  'Crude oil':              { unit: 'barrels', pricePerUnit: 82,    icon: 'CRD', color: '#F59E0B' },
  'Fuel oil':               { unit: 'barrels', pricePerUnit: 70,    icon: 'FUO', color: '#EA580C' },
  'Crude / fuel oil':       { unit: 'barrels', pricePerUnit: 80,    icon: 'CRD', color: '#F59E0B' },
  'Liquefied natural gas':  { unit: 'MMBtu',   pricePerUnit: 9.2,   icon: 'LNG', color: '#8B5CF6' },
  'Liquefied petroleum gas':{ unit: 'tonnes',  pricePerUnit: 580,   icon: 'LPG', color: '#06B6D4' },
  'Iron ore':               { unit: 'tonnes',  pricePerUnit: 108,   icon: 'IO',  color: '#6B7280' },
  'Coal':                   { unit: 'tonnes',  pricePerUnit: 130,   icon: 'COL', color: '#374151' },
  'Grain / wheat':          { unit: 'tonnes',  pricePerUnit: 220,   icon: 'GRN', color: '#D97706' },
  'Bauxite':                { unit: 'tonnes',  pricePerUnit: 45,    icon: 'BAU', color: '#92400E' },
  'Mixed containers':       { unit: 'TEU',     pricePerUnit: 2200,  icon: 'CTR', color: '#3B82F6' },
  'Chemicals':              { unit: 'tonnes',  pricePerUnit: 420,   icon: 'CHM', color: '#F97316' },
};

function estimateCargo(vessel) {
  const draughtM = parseFloat(vessel.draught);
  const maxDraught = parseFloat(vessel.maxDraught);
  const loadFactor = Math.min(draughtM / maxDraught, 1.0);
  const loaded = loadFactor > 0.7;
  const partial = loadFactor > 0.4 && loadFactor <= 0.7;

  const com = COMMODITIES[vessel.cargo] || COMMODITIES['Crude oil'];
  const estimatedUnits = Math.round(vessel.capacity * loadFactor);
  const estimatedValue = estimatedUnits * com.pricePerUnit;

  return {
    loadFactor: Math.round(loadFactor * 100),
    loaded,
    partial,
    status: loaded ? 'Laden' : partial ? 'Partial load' : 'Ballast (empty)',
    estimatedUnits,
    estimatedValue,
    unit: com.unit,
    icon: com.icon,
  };
}

function estimateESG(vessel) {
  const age = 2026 - vessel.built;
  // CII grade — newer vessels and certain types are more efficient
  const baseScore = age <= 5 ? 0 : age <= 10 ? 1 : age <= 15 ? 2 : age <= 20 ? 3 : 4;
  const typeAdj = { container: -1, lng: -1, vlcc: 0, tanker: 0, bulk: 1, lpg: 0, chemical: 0 }[vessel.type] || 0;
  const gradeIndex = Math.max(0, Math.min(4, baseScore + typeAdj));
  const grades = ['A', 'B', 'C', 'D', 'E'];
  const ciiGrade = grades[gradeIndex];

  // Rough CO2 estimate: capacity-based fuel burn proxy, scaled by route distance assumption
  const capacityFactor = vessel.capacity / 50000;
  const ageFactor = 1 + (age * 0.015);
  const estimatedCO2 = Math.round(capacityFactor * 180 * ageFactor);

  // EU-bound routes incur ETS cost (rough: route or destination mentions Europe-relevant ports)
  const euPorts = ['Rotterdam','Antwerp','Hamburg','Sines','Zeebrugge','Constanta','Piraeus'];
  const etsExposed = euPorts.some(p => (vessel.dest||'').includes(p)) || (vessel.route||'').toLowerCase().includes('europe');
  const etsCostPerTonne = 75; // approx EUR per tonne CO2 under EU ETS
  const etsCost = etsExposed ? Math.round(estimatedCO2 * etsCostPerTonne * 0.5) : 0; // 50% phase-in approximation for non-EU leg

  return { ciiGrade, gradeIndex, estimatedCO2, etsExposed, etsCost, age };
}

const RAW_VESSELS = [
  { id:1,  name:'Euronav Olympia',    type:'vlcc',      lng:56.2,   lat:24.5,  speed:11.8, heading:220, flag:'Belgium',      imo:'IMO9234501', draught:'20.1', maxDraught:'22.0', dest:'Fujairah',    cargo:'Crude oil',               capacity:2000000, mmsi:'205100001', length:'333m', built:2011, route:'Persian Gulf → Singapore' },
  { id:2,  name:'TI Europe',          type:'vlcc',      lng:68.0,   lat:18.2,  speed:13.2, heading:120, flag:'Belgium',      imo:'IMO9234502', draught:'21.5', maxDraught:'22.5', dest:'Ningbo',      cargo:'Crude oil',               capacity:3000000, mmsi:'205100002', length:'380m', built:2002, route:'Middle East → China' },
  { id:3,  name:'Nordic Orion',       type:'bulk',      lng:-28.5,  lat:42.1,  speed:14.2, heading:85,  flag:'Norway',       imo:'IMO9345601', draught:'12.8', maxDraught:'17.0', dest:'Rotterdam',   cargo:'Iron ore',                capacity:75000,   mmsi:'257100001', length:'225m', built:2014, route:'Brazil → Europe' },
  { id:4,  name:'Maersk Elba',        type:'container', lng:80.5,   lat:6.2,   speed:21.0, heading:280, flag:'Denmark',      imo:'IMO9456701', draught:'14.2', maxDraught:'16.0', dest:'Rotterdam',   cargo:'Mixed containers',        capacity:15000,   mmsi:'219100001', length:'367m', built:2021, route:'Asia → Europe' },
  { id:5,  name:'Arctic Lady',        type:'lng',       lng:4.5,    lat:61.2,  speed:17.5, heading:200, flag:'Norway',       imo:'IMO9567801', draught:'11.2', maxDraught:'12.5', dest:'Zeebrugge',   cargo:'Liquefied natural gas',   capacity:141000,  mmsi:'257100002', length:'288m', built:2006, route:'Norway → Belgium' },
  { id:6,  name:'BW Pavilion',        type:'vlcc',      lng:103.8,  lat:1.1,   speed:9.5,  heading:270, flag:'Singapore',    imo:'IMO9678901', draught:'19.8', maxDraught:'22.0', dest:'Chiba',       cargo:'Crude oil',               capacity:2100000, mmsi:'563100001', length:'336m', built:2010, route:'Middle East → Japan' },
  { id:7,  name:'Cargill Falcon',     type:'bulk',      lng:122.5,  lat:-23.5, speed:12.4, heading:355, flag:'Marshall Is.', imo:'IMO9789001', draught:'14.5', maxDraught:'18.2', dest:'Qingdao',     cargo:'Iron ore',                capacity:180000,  mmsi:'538100001', length:'292m', built:2017, route:'Australia → China' },
  { id:8,  name:'Maran Gas Coronis',  type:'lng',       lng:44.0,   lat:11.8,  speed:16.0, heading:145, flag:'Greece',       imo:'IMO9890101', draught:'10.8', maxDraught:'12.5', dest:'Ain Sokhna',  cargo:'Liquefied natural gas',   capacity:174000,  mmsi:'241100001', length:'295m', built:2019, route:'Qatar → Egypt' },
  { id:9,  name:'Scorpio Tanker',     type:'tanker',    lng:-8.2,   lat:35.8,  speed:13.7, heading:195, flag:'Greece',       imo:'IMO9901201', draught:'13.5', maxDraught:'15.0', dest:'Lagos',       cargo:'Fuel oil',                capacity:110000,  mmsi:'241100002', length:'250m', built:2016, route:'Europe → West Africa' },
  { id:10, name:'Louis Dreyfus Pampero',type:'bulk',    lng:-43.5,  lat:-24.2, speed:11.1, heading:45,  flag:'France',       imo:'IMO9012301', draught:'9.2',  maxDraught:'18.5', dest:'Paranaguá',   cargo:'Grain / wheat',           capacity:82000,   mmsi:'228100001', length:'229m', built:2013, route:'Brazil coastal' },
  { id:11, name:'CMA CGM Antoine',    type:'container', lng:114.3,  lat:22.1,  speed:19.8, heading:90,  flag:'France',       imo:'IMO9123401', draught:'13.8', maxDraught:'16.0', dest:'Los Angeles', cargo:'Mixed containers',        capacity:20776,   mmsi:'228100002', length:'400m', built:2020, route:'Asia → USA' },
  { id:12, name:'Sabine Howaldt',     type:'chemical',  lng:9.8,    lat:54.2,  speed:10.5, heading:355, flag:'Germany',      imo:'IMO9234602', draught:'7.8',  maxDraught:'10.5', dest:'Hamburg',     cargo:'Chemicals',               capacity:19000,   mmsi:'211100001', length:'145m', built:2015, route:'Baltic → Hamburg' },
  { id:13, name:'Pacific Emerald',    type:'vlcc',      lng:130.5,  lat:30.2,  speed:8.2,  heading:45,  flag:'Japan',        imo:'IMO9345702', draught:'21.8', maxDraught:'22.5', dest:'Chiba',       cargo:'Crude oil',               capacity:2900000, mmsi:'432100001', length:'378m', built:2008, route:'Middle East → Japan' },
  { id:14, name:'Hafnia Lise',        type:'tanker',    lng:-77.2,  lat:25.5,  speed:12.8, heading:310, flag:'Denmark',      imo:'IMO9456802', draught:'10.2', maxDraught:'14.5', dest:'Houston',     cargo:'Fuel oil',                capacity:75000,   mmsi:'219100002', length:'183m', built:2018, route:'Caribbean → Gulf of Mexico' },
  { id:15, name:'Golar Tundra',       type:'lng',       lng:-8.5,   lat:38.5,  speed:14.5, heading:220, flag:'Bermuda',      imo:'IMO9567902', draught:'11.8', maxDraught:'12.5', dest:'Sines',       cargo:'Liquefied natural gas',   capacity:170000,  mmsi:'310100001', length:'292m', built:2021, route:'USA → Portugal' },
  { id:16, name:'Petros K',           type:'bulk',      lng:28.0,   lat:43.5,  speed:7.8,  heading:180, flag:'Greece',       imo:'IMO9678902', draught:'10.5', maxDraught:'16.8', dest:'Constanta',   cargo:'Grain / wheat',           capacity:68000,   mmsi:'241100003', length:'190m', built:2009, route:'Black Sea' },
  { id:17, name:'Berge Bulk Nansen',  type:'bulk',      lng:95.5,   lat:5.5,   speed:13.1, heading:280, flag:'Marshall Is.', imo:'IMO9789102', draught:'15.8', maxDraught:'19.5', dest:'Vizag',       cargo:'Coal',                    capacity:180000,  mmsi:'538100002', length:'300m', built:2016, route:'Indonesia → India' },
  { id:18, name:'Navigator Aurora',   type:'lpg',       lng:-60.5,  lat:14.8,  speed:15.2, heading:85,  flag:'Marshall Is.', imo:'IMO9890202', draught:'7.2',  maxDraught:'9.0',  dest:'Houston',     cargo:'Liquefied petroleum gas', capacity:22000,   mmsi:'538100003', length:'160m', built:2014, route:'Caribbean → USA' },
  { id:19, name:'Cosco Shipping Aries',type:'container',lng:155.0,  lat:18.5,  speed:20.1, heading:60,  flag:'China',        imo:'IMO9901302', draught:'14.5', maxDraught:'16.5', dest:'Long Beach',  cargo:'Mixed containers',        capacity:21237,   mmsi:'477100001', length:'400m', built:2022, route:'Asia → USA West Coast' },
  { id:20, name:'Front Ull',          type:'vlcc',      lng:20.5,   lat:-32.5, speed:14.8, heading:165, flag:'Norway',       imo:'IMO9012402', draught:'20.5', maxDraught:'22.0', dest:'Rotterdam',   cargo:'Crude oil',               capacity:2000000, mmsi:'257100003', length:'333m', built:2015, route:'West Africa → Europe' },
  { id:21, name:'Trafigura Elandra',  type:'vlcc',      lng:72.5,   lat:19.8,  speed:12.1, heading:300, flag:'Marshall Is.', imo:'IMO9234521', draught:'21.2', maxDraught:'22.5', dest:'Rotterdam',   cargo:'Crude oil',               capacity:2200000, mmsi:'538100021', length:'340m', built:2019, route:'Ras Tanura → Rotterdam' },
  { id:22, name:'BW Hawk',            type:'lng',       lng:142.5,  lat:35.2,  speed:16.8, heading:200, flag:'Singapore',    imo:'IMO9345621', draught:'10.9', maxDraught:'12.5', dest:'Tobata',      cargo:'Liquefied natural gas',   capacity:162000,  mmsi:'563100022', length:'290m', built:2020, route:'Australia → Japan' },
  { id:23, name:'Stamford Eagle',     type:'bulk',      lng:-32.5,  lat:-18.2, speed:13.5, heading:45,  flag:'Greece',       imo:'IMO9456821', draught:'16.2', maxDraught:'19.0', dest:'Qingdao',     cargo:'Iron ore',                capacity:190000,  mmsi:'241100023', length:'300m', built:2017, route:'Brazil → China' },
  { id:24, name:'MSC Rosaria',        type:'container', lng:29.5,   lat:31.2,  speed:18.2, heading:355, flag:'Panama',       imo:'IMO9567921', draught:'13.8', maxDraught:'16.0', dest:'Hamburg',     cargo:'Mixed containers',        capacity:19000,   mmsi:'352100024', length:'366m', built:2022, route:'Suez Canal → Hamburg' },
  { id:25, name:'Vitol Jupiter',      type:'tanker',    lng:108.5,  lat:2.8,   speed:10.4, heading:90,  flag:'Marshall Is.', imo:'IMO9678921', draught:'14.1', maxDraught:'15.5', dest:'Chiba',       cargo:'Fuel oil',                capacity:105000,  mmsi:'538100025', length:'245m', built:2016, route:'Singapore → Japan' },
];

export const VESSELS = RAW_VESSELS.map(v => ({ ...v, cargoEstimate: estimateCargo(v), esg: estimateESG(v) }));
