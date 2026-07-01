import { PORTS } from './ports';

// Map port names/keywords to port IDs
const PORT_KEYWORDS = {
  'ras tanura': 'ras_tanura', 'saudi': 'ras_tanura', 'saudi arabia': 'ras_tanura',
  'fujairah': 'fujairah', 'uae': 'fujairah', 'dubai': 'fujairah',
  'jeddah': 'jeddah',
  'rotterdam': 'rotterdam', 'netherlands': 'rotterdam',
  'antwerp': 'antwerp', 'belgium': 'antwerp',
  'hamburg': 'hamburg', 'germany': 'hamburg',
  'singapore': 'singapore',
  'shanghai': 'shanghai',
  'ningbo': 'ningbo', 'zhoushan': 'ningbo',
  'guangzhou': 'guangzhou', 'nansha': 'guangzhou',
  'tianjin': 'tianjin',
  'houston': 'houston', 'texas': 'houston',
  'long beach': 'long_beach', 'los angeles': 'long_beach',
  'philadelphia': 'philadelphia',
  'new orleans': 'new_orleans',
  'santos': 'santos', 'brazil': 'santos',
  'lagos': 'lagos', 'nigeria': 'lagos',
  'busan': 'busan', 'korea': 'busan',
  'chiba': 'chiba', 'japan': 'chiba', 'tokyo': 'chiba',
  'mumbai': 'mumbai', 'india': 'mumbai',
  'port hedland': 'port_hedland', 'australia': 'port_hedland',
  'sullom voe': 'sullom_voe', 'uk': 'sullom_voe',
  'valdez': 'valdez', 'alaska': 'valdez',
  'marseille': 'marseille', 'france': 'marseille',
  'piraeus': 'piraeus', 'greece': 'piraeus',
  'durban': 'durban', 'south africa': 'durban',
  'odessa': 'odessa', 'ukraine': 'odessa',
  'gibraltar': 'gibraltar',
  'colombo': 'colombo', 'sri lanka': 'colombo',
  'tanjung pelepas': 'tanjung_pelepas', 'malaysia': 'tanjung_pelepas',
};

// Typical voyage days between major port pairs
const VOYAGE_DAYS = {
  'ras_tanura-rotterdam': 22, 'ras_tanura-singapore': 8, 'ras_tanura-chiba': 18,
  'ras_tanura-ningbo': 16, 'ras_tanura-houston': 35, 'ras_tanura-long_beach': 28,
  'ras_tanura-mumbai': 5,
  'santos-rotterdam': 14, 'santos-houston': 8, 'santos-chiba': 28,
  'port_hedland-ningbo': 9, 'port_hedland-shanghai': 10, 'port_hedland-chiba': 11,
  'sullom_voe-rotterdam': 3, 'sullom_voe-antwerp': 4,
  'houston-rotterdam': 12, 'houston-antwerp': 13,
  'valdez-long_beach': 4, 'valdez-chiba': 14,
  'lagos-rotterdam': 16, 'lagos-antwerp': 17,
  'new_orleans-rotterdam': 14, 'new_orleans-antwerp': 15,
};

export function findPort(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  for (const [keyword, portId] of Object.entries(PORT_KEYWORDS)) {
    if (t.includes(keyword)) {
      return PORTS.find(p => p.id === portId) || null;
    }
  }
  return null;
}

export function getVoyageDays(originId, destId) {
  const key1 = `${originId}-${destId}`;
  const key2 = `${destId}-${originId}`;
  return VOYAGE_DAYS[key1] || VOYAGE_DAYS[key2] || null;
}

export function inferBuyers(destPort, cargoType) {
  if (!destPort) return [];
  return destPort.buyers.filter(b =>
    !cargoType || b.commodity.toLowerCase().includes(cargoType.toLowerCase().split(' ')[0])
  ).slice(0, 3);
}

export function inferOriginPort(vessel) {
  if (vessel.lastPort) return findPort(vessel.lastPort);
  if (vessel.route) return findPort(vessel.route.split('→')[0]);
  return null;
}

export function inferDestPort(vessel) {
  if (vessel.dest) return findPort(vessel.dest);
  if (vessel.route) return findPort(vessel.route.split('→')[1]);
  return null;
}

export function formatValue(val) {
  if (!val) return '—';
  if (val >= 1e9) return `$${(val/1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val/1e6).toFixed(1)}M`;
  return `$${val.toLocaleString()}`;
}
