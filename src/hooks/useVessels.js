import { useState, useEffect, useRef, useCallback } from 'react';
import { VESSELS, VESSEL_TYPES } from '../data/vessels';
import { CHOKEPOINTS, detectChokepoints } from '../data/chokepoints';
import { mapAISResponse } from '../utils/aisMapper';

// ── API config ─────────────────────────────────────────────────────
const AISHUB_USER    = process.env.REACT_APP_AISHUB_USERNAME || null;
const MT_KEY         = process.env.REACT_APP_MARINETRAFFIC_KEY || null;
const DATADOCKED_KEY = process.env.REACT_APP_DATADOCKED_KEY || null;

// Major shipping zones to query — gives good global spread within free credit limits
const SHIPPING_ZONES = [
  { lat: 1.3,   lng: 103.8, radius: 50 },  // Singapore Strait
  { lat: 51.9,  lng: 4.1,   radius: 50 },  // Rotterdam
  { lat: 29.4,  lng: -94.8, radius: 50 },  // Houston / Gulf
  { lat: 25.3,  lng: 56.3,  radius: 50 },  // Strait of Hormuz
  { lat: 31.2,  lng: 32.3,  radius: 50 },  // Suez Canal
];

function formatValue(val) {
  if (!val) return '—';
  if (val >= 1e9) return `$${(val/1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val/1e6).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
}

async function fetchAISHub(username) {
  // AISHub returns compressed data — we use a CORS proxy for browser requests
  // In production, route this through your own backend to avoid CORS
  const url = `https://data.aishub.net/ws.php?username=${username}&format=1&output=json&compress=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AISHub error ${res.status}`);
  const data = await res.json();
  // AISHub wraps data: first element is metadata, second is vessels array
  const vessels = Array.isArray(data[1]) ? data[1] : data;
  return mapAISResponse(vessels, 'aishub');
}

async function fetchMarineTraffic(apiKey) {
  const url = `https://services.marinetraffic.com/api/getvessel/v:8/${apiKey}/protocol:jsono`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MarineTraffic error ${res.status}`);
  const data = await res.json();
  return mapAISResponse(data, 'marinetraffic');
}

async function fetchDataDocked() {
  // Calls our own serverless proxy (api/vessels.js) instead of Data Docked directly —
  // avoids browser CORS restrictions since the proxy makes the call server-side.
  const res = await fetch('/api/vessels');
  if (!res.ok) throw new Error(`Vessels proxy error ${res.status}`);
  const data = await res.json();
  const arr = data.vessels || [];
  return mapAISResponse(arr, 'datadocked');
}

async function fetchLiveAIS() {
  if (MT_KEY) {
    try {
      const vessels = await fetchMarineTraffic(MT_KEY);
      if (vessels.length > 0) { console.log(`✅ MarineTraffic: ${vessels.length} vessels`); return { vessels, source: 'MarineTraffic' }; }
    } catch (e) { console.warn('MarineTraffic failed:', e.message); }
  }
  if (AISHUB_USER) {
    try {
      const vessels = await fetchAISHub(AISHUB_USER);
      if (vessels.length > 0) { console.log(`✅ AISHub: ${vessels.length} vessels`); return { vessels, source: 'AISHub' }; }
    } catch (e) { console.warn('AISHub failed:', e.message); }
  }
  if (DATADOCKED_KEY) {
    try {
      const vessels = await fetchDataDocked();
      if (vessels.length > 0) { console.log(`✅ Data Docked: ${vessels.length} vessels`); return { vessels, source: 'Data Docked' }; }
    } catch (e) { console.warn('Data Docked failed:', e.message); }
  }
  return null;
}

export function useVessels() {
  const [liveVessels, setLiveVessels] = useState(null);
  const [liveFetchSource, setLiveFetchSource] = useState(null); // raw fetched source name, e.g. 'Data Docked'
  const [mode, setMode] = useState('demo'); // 'demo' | 'live' — user-controlled toggle
  const dataSource = mode === 'live' ? (liveVessels ? liveFetchSource : (liveFetchSource === 'Unavailable' ? 'Live unavailable' : 'Live (connecting…)')) : 'Demo mode';
  const activeVessels = (mode === 'live' && liveVessels) ? liveVessels : VESSELS;

  const [positions, setPositions] = useState(() => {
    const p = {};
    VESSELS.forEach(v => { p[v.id] = { lng: v.lng + (Math.random()-0.5)*1.5, lat: v.lat + (Math.random()-0.5)*1.5 }; });
    return p;
  });

  // Ensure any new vessels get positions
  useEffect(() => {
    setPositions(prev => {
      const next = { ...prev };
      VESSELS.forEach(v => {
        if (!next[v.id]) {
          next[v.id] = { lng: v.lng + (Math.random()-0.5)*1.5, lat: v.lat + (Math.random()-0.5)*1.5 };
        }
      });
      return next;
    });
  }, []);

  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [alerts, setAlerts] = useState([]);
  const prevPositionsRef = useRef({});
  const tickRef = useRef(0);

  // Fetch live data only when the user switches to "live" mode, and only once
  // (credits are limited — never auto-refresh or fetch on page load)
  const hasFetchedLive = useRef(false);
  useEffect(() => {
    if (mode !== 'live' || hasFetchedLive.current) return;
    hasFetchedLive.current = true;
    async function load() {
      const result = await fetchLiveAIS();
      if (result) {
        setLiveVessels(result.vessels);
        setLiveFetchSource(result.source);
      } else {
        setLiveFetchSource('Unavailable');
      }
    }
    load();
  }, [mode]);

  // When mode or live data changes, sync positions to match active vessel set
  useEffect(() => {
    if (mode === 'live' && liveVessels) {
      const livePos = {};
      liveVessels.forEach(v => { livePos[v.id] = { lat: v.lat, lng: v.lng }; });
      setPositions(livePos);
    } else if (mode === 'demo') {
      setPositions(prev => {
        const next = {};
        VESSELS.forEach(v => {
          next[v.id] = prev[v.id] || { lng: v.lng + (Math.random()-0.5)*1.5, lat: v.lat + (Math.random()-0.5)*1.5 };
        });
        return next;
      });
    }
  }, [mode, liveVessels]);

  // Position animation + chokepoint detection
  useEffect(() => {
    const isLive = mode === 'live' && !!liveVessels;
    const interval = setInterval(() => {
      tickRef.current += 1;
      setPositions(prev => {
        const next = {};
        activeVessels.forEach(v => {
          if (isLive) {
            next[v.id] = prev[v.id] || { lat: v.lat, lng: v.lng };
          } else {
            const rad = (v.heading * Math.PI) / 180;
            const spd = v.speed * 0.00007;
            let lng = (prev[v.id]?.lng ?? v.lng) + Math.sin(rad) * spd;
            let lat = (prev[v.id]?.lat ?? v.lat) + Math.cos(rad) * spd;
            if (lng > 180) lng = -180; if (lng < -180) lng = 180;
            if (lat > 85) lat = 85; if (lat < -85) lat = -85;
            next[v.id] = { lng, lat };
          }
        });

        // Chokepoint detection
        const newAlerts = [];
        activeVessels.forEach(v => {
          const pos = next[v.id];
          const prevPos = prevPositionsRef.current[v.id];
          if (!prevPos || !pos) return;
          detectChokepoints(v, pos).forEach(cp => {
            if (!detectChokepoints(v, prevPos).find(p => p.id === cp.id)) {
              newAlerts.push({
                id: Date.now() + Math.random(),
                vesselName: v.name, type: v.type, cargo: v.cargo,
                chokepoint: cp, zone: cp.name,
                cargoValue: v.cargoEstimate ? formatValue(v.cargoEstimate.estimatedValue) : null,
                time: new Date(), isLive,
              });
            }
          });
        });

        prevPositionsRef.current = next;
        if (newAlerts.length > 0) setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));

        // Simulated alerts for demo
        if (!isLive && tickRef.current % 12 === 0) {
          const vessel = VESSELS[Math.floor(Math.random() * VESSELS.length)];
          const cp = CHOKEPOINTS[Math.floor(Math.random() * CHOKEPOINTS.length)];
          setAlerts(prev => [{
            id: Date.now(), vesselName: vessel.name, type: vessel.type, cargo: vessel.cargo,
            chokepoint: cp, zone: cp.name,
            cargoValue: vessel.cargoEstimate ? formatValue(vessel.cargoEstimate.estimatedValue) : null,
            time: new Date(), isLive: false,
          }, ...prev].slice(0, 50));
        }

        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [activeVessels, liveVessels]);

  const visibleVessels = useCallback(() => {
    const source = (mode === 'live' && liveVessels) ? liveVessels : VESSELS;
    const q = searchQuery.trim().toLowerCase();
    return source.filter(v => {
      const matchesFilter = filter === 'all' || v.type === filter;
      const matchesSearch = !q ||
        (v.name||'').toLowerCase().includes(q) ||
        (v.flag||'').toLowerCase().includes(q) ||
        (v.imo||'').toLowerCase().includes(q) ||
        (v.mmsi||'').toLowerCase().includes(q) ||
        (v.cargo||'').toLowerCase().includes(q) ||
        (v.dest||'').toLowerCase().includes(q) ||
        (v.route||'').toLowerCase().includes(q) ||
        (v.typeName||'').toLowerCase().includes(q) ||
        (v.shipClass||'').toLowerCase().includes(q) ||
        (v.lastPort||'').toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [mode, liveVessels, filter, searchQuery]);

  const selectedVessel = selectedId
    ? ((mode === 'live' && liveVessels) ? liveVessels : VESSELS).find(v => String(v.id) === String(selectedId))
    : null;

  const allVessels = (mode === 'live' && liveVessels) ? liveVessels : VESSELS;
  const counts = { all: allVessels.length };
  Object.keys(VESSEL_TYPES).forEach(t => { counts[t] = allVessels.filter(v => v.type === t).length; });

  return {
    positions, filter, setFilter, selectedId, setSelectedId, selectedVessel,
    searchQuery, setSearchQuery, visibleVessels, counts, alerts, dataSource, mode, setMode,
  };
}
