import React, { useEffect, useRef } from 'react';
import { VESSEL_TYPES } from '../data/vessels';
import { CHOKEPOINTS } from '../data/chokepoints';
import { PORTS } from '../data/ports';

export default function MapCanvas({ vessels, positions, selectedId, onSelectVessel, onSelectPort, highlightPortId, onSelectChokepoint, searchOpen }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});
  const portMarkersRef = useRef({});
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = window.L;

      const map = L.map(mapRef.current, {
        center: [20, 40], zoom: 3, zoomControl: true, attributionControl: true,
        zoomSnap: 1, zoomDelta: 1, wheelPxPerZoomLevel: 120,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd', maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;

      // Chokepoint zones
      CHOKEPOINTS.forEach(cp => {
        const { lngMin, latMin, lngMax, latMax } = cp.bounds;
        const rect = L.rectangle([[latMin, lngMin], [latMax, lngMax]], {
          color: cp.importanceColor, weight: 1.5,
          fillColor: cp.importanceColor, fillOpacity: 0.1, dashArray: '4 4',
        }).addTo(map);
        rect.on('click', () => onSelectChokepoint && onSelectChokepoint(cp.id));
        rect.bindTooltip(`<div style="font-family:-apple-system,sans-serif;"><div style="font-weight:700;font-size:13px;">${cp.icon} ${cp.name}</div><div style="font-size:11px;color:#aaa;margin-top:2px;">${cp.dailyOil}</div><div style="font-size:11px;color:#aaa;">${cp.description}</div><div style="font-size:11px;color:#F59E0B;margin-top:3px;">Click for live alerts →</div></div>`, { sticky: true, className: 'vessel-tooltip' });
      });

      // Port markers
      PORTS.forEach(port => {
        const isHighlighted = highlightPortId === port.id;
        const portIcon = L.divIcon({
          className: '',
          html: `<div style="width:32px;height:32px;border-radius:50%;background:${isHighlighted ? '#EF4444' : '#0F2040'};border:2px solid ${isHighlighted ? '#fff' : '#3B82F6'};display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;${isHighlighted ? 'animation:portPulse 1.5s infinite;' : 'box-shadow:0 0 8px rgba(59,130,246,0.4);'}">${port.icon}</div>`,
          iconSize: [32, 32], iconAnchor: [16, 16],
        });
        const marker = L.marker([port.lat, port.lng], { icon: portIcon, zIndexOffset: isHighlighted ? 100 : -100 })
          .addTo(map)
          .on('click', () => onSelectPort && onSelectPort(port.id));
        marker.bindTooltip(`<div style="font-family:-apple-system,sans-serif;"><div style="font-weight:700;font-size:12px;">${port.icon} ${port.name}</div><div style="font-size:11px;color:#aaa;">${port.annualThroughput} · Click for buyer intel</div></div>`, { sticky: true, className: 'vessel-tooltip' });
        portMarkersRef.current[port.id] = { marker, port };
      });
    };
    document.head.appendChild(script);
  }, []);

  // Fly to selected vessel when selectedId changes
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !selectedId) return;
    const pos = positions[selectedId] || positions[String(selectedId)];
    if (pos && pos.lat && pos.lng) {
      map.flyTo([pos.lat, pos.lng], 5, { duration: 1.2 });
    }
  }, [selectedId]);
  useEffect(() => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!L || !map) return;
    Object.entries(portMarkersRef.current).forEach(([id, { marker, port }]) => {
      const isHighlighted = highlightPortId === id;
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;border-radius:50%;background:${isHighlighted ? '#EF4444' : '#0F2040'};border:2px solid ${isHighlighted ? '#fff' : '#3B82F6'};display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;${isHighlighted ? 'animation:portPulse 1.5s infinite;' : 'box-shadow:0 0 8px rgba(59,130,246,0.4);'}">${port.icon}</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
      });
      marker.setIcon(icon);
      marker.setZIndexOffset(isHighlighted ? 500 : -100);
      if (isHighlighted) {
        map.flyTo([port.lat, port.lng], 6, { duration: 1.2 });
      }
    });
  }, [highlightPortId]);

  useEffect(() => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!L || !map) return;

    const visibleIds = new Set(vessels.map(v => v.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!visibleIds.has(Number(id))) { markersRef.current[id].remove(); delete markersRef.current[id]; }
    });

    vessels.forEach(v => {
      const pos = positions[v.id];
      if (!pos) return;
      const tc = VESSEL_TYPES[v.type] || { color:'#94A3B8', bg:'rgba(148,163,184,0.15)', label:v.type||'Vessel' };
      const isSelected = String(selectedId) === String(v.id);
      const size = isSelected ? 18 : 11;

      const icon = L.divIcon({
        className: '',
        html: isSelected
          ? `<div style="position:relative;width:${size}px;height:${size}px;">
               <div style="position:absolute;inset:-8px;border-radius:50%;background:${tc.color}30;animation:pulse 1.2s ease-out infinite;"></div>
               <div style="position:absolute;inset:-4px;border-radius:50%;background:${tc.color}50;animation:pulse 1.2s ease-out infinite 0.3s;"></div>
               <div style="width:${size}px;height:${size}px;border-radius:50%;background:${tc.color};border:3px solid #fff;box-shadow:0 0 20px ${tc.color};position:relative;z-index:1;"></div>
             </div>`
          : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${tc.color};border:2px solid #0a1628;transition:all 0.3s;"></div>`,
        iconSize: [size + 16, size + 16], iconAnchor: [(size + 16)/2, (size + 16)/2],
      });

      if (markersRef.current[v.id]) {
        markersRef.current[v.id].setLatLng([pos.lat, pos.lng]);
        markersRef.current[v.id].setIcon(icon);
      } else {
        const cargoVal = v.cargoEstimate ? (v.cargoEstimate.estimatedValue >= 1e6 ? '$'+(v.cargoEstimate.estimatedValue/1e6).toFixed(0)+'M' : '$'+v.cargoEstimate.estimatedValue.toLocaleString()) : '—';
        const marker = L.marker([pos.lat, pos.lng], { icon })
          .addTo(map)
          .on('click', () => onSelectVessel(isSelected ? null : v.id));
        marker.bindPopup(`<div style="font-family:-apple-system,sans-serif;min-width:180px;"><div style="font-weight:700;font-size:13px;margin-bottom:4px;">${v.name}</div><div style="font-size:11px;color:#888;">${VESSEL_TYPES[v.type]?.label} · ${v.flag}</div><div style="font-size:12px;margin-top:6px;">Speed ${v.speed.toFixed(1)} kts · Heading ${v.heading}°</div><div style="font-size:12px;">Cargo: ${v.cargo}</div><div style="font-size:12px;">Destination: ${v.dest}</div><div style="font-size:12px;color:#10B981;margin-top:4px;">Est. value: ${cargoVal}</div></div>`);
        markersRef.current[v.id] = marker;
      }

      if (isSelected) {
        markersRef.current[v.id].bindTooltip(v.name, { permanent: true, direction: 'right', offset: [10,0], className: 'vessel-tooltip' }).openTooltip();
        const pos = positions[v.id];
        if (pos) leafletMapRef.current?.flyTo([pos.lat, pos.lng], 5, { duration: 1.0 });
      } else {
        markersRef.current[v.id].unbindTooltip();
      }
    });
  }, [vessels, positions, selectedId, onSelectVessel]);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          70% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes portPulse {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
          70% { box-shadow: 0 0 0 14px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        .vessel-tooltip{background:rgba(11,24,41,0.96)!important;border:1px solid #1E3A5F!important;border-radius:7px!important;color:#E2E8F0!important;font-size:11px!important;font-family:-apple-system,sans-serif!important;font-weight:500!important;padding:4px 10px!important;box-shadow:none!important;}
        .vessel-tooltip::before{display:none!important;}
        .leaflet-popup-content-wrapper{background:rgba(11,24,41,0.97)!important;border:1px solid #1E3A5F!important;border-radius:9px!important;box-shadow:none!important;color:#E2E8F0!important;}
        .leaflet-popup-tip{background:#1E3A5F!important;}
        .leaflet-popup-close-button{color:#64748B!important;}
        .leaflet-control-zoom a{background:rgba(11,24,41,0.95)!important;border-color:#1E3A5F!important;color:#94A3B8!important;}
        .leaflet-control-zoom a:hover{background:#0F2040!important;color:#fff!important;}
        .leaflet-control-attribution{background:rgba(11,24,41,0.7)!important;color:#334155!important;font-size:10px!important;}
      `}</style>
      <div ref={mapRef} style={{ width:'100%', height:'100%', pointerEvents: searchOpen ? 'none' : 'auto' }} />
    </>
  );
}
