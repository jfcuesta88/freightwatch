import React, { useState } from 'react';
import MapCanvas from './components/MapCanvas';
import VesselDetail from './components/VesselDetail';
import AlertsPanel from './components/AlertsPanel';
import PortPanel from './components/PortPanel';
import MarketPanel from './components/MarketPanel';
import SanctionsPanel from './components/SanctionsPanel';
import CommodityFlows from './components/CommodityFlows';
import ESGPanel from './components/ESGPanel';
import { useVessels } from './hooks/useVessels';
import { VESSEL_TYPES, VESSELS } from './data/vessels';
import { PORTS } from './data/ports';
import { CHOKEPOINTS } from './data/chokepoints';
import { SANCTIONED_VESSELS } from './data/sanctions';

export default function App() {
  const {
    positions, filter, setFilter,
    selectedId, setSelectedId, selectedVessel,
    visibleVessels, counts, alerts, dataSource, mode, setMode,
  } = useVessels();

  const [showPorts, setShowPorts]         = useState(false);
  const [showMarket, setShowMarket]       = useState(false);
  const [showAlerts, setShowAlerts]       = useState(false);
  const [showSanctions, setShowSanctions] = useState(false);
  const [showFlows, setShowFlows]         = useState(false);
  const [showESG, setShowESG]             = useState(false);
  const [highlightPortId, setHighlightPortId]         = useState(null);
  const [highlightChokepoint, setHighlightChokepoint] = useState(null);
  const [search, setSearch]               = useState('');
  const [searchOpen, setSearchOpen]       = useState(false);

  const vessels = visibleVessels();
  const unreadAlerts = alerts.filter(a => a.chokepoint).length;
  const isLive = mode === 'live';
  const q = search.trim().toLowerCase();

  const srVessels = q ? VESSELS.filter(v => v.name.toLowerCase().includes(q) || (v.flag||'').toLowerCase().includes(q) || (v.cargo||'').toLowerCase().includes(q) || (v.dest||'').toLowerCase().includes(q) || (v.imo||'').toLowerCase().includes(q) || (v.mmsi||'').toLowerCase().includes(q)).slice(0,6) : [];
  const srPorts   = q ? PORTS.filter(p => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)).slice(0,5) : [];
  const srStraits = q ? CHOKEPOINTS.filter(c => c.name.toLowerCase().includes(q)).slice(0,3) : [];
  const hasResults = srVessels.length + srPorts.length + srStraits.length > 0;

  const rightContent = showAlerts ? 'alerts' : showMarket ? 'market' : showPorts ? 'ports' : showSanctions ? 'sanctions' : showFlows ? 'flows' : showESG ? 'esg' : selectedId ? 'vessel' : null;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', width:'100vw', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', background:'#0a1628' }}>

      {/* NAV */}
      <div style={{ height:54, background:'#0B1829', borderBottom:'1px solid #1E3A5F', display:'flex', alignItems:'center', padding:'0 14px', gap:8, flexShrink:0, zIndex:1000, position:'relative' }}>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:6, flexShrink:0 }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect width="26" height="26" rx="6" fill="#1E3A5F"/><path d="M5 18l4-8 4 4 4-6 4 10H5z" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round" fill="none"/><circle cx="21" cy="7" r="2" fill="#10B981"/></svg>
          <span style={{ fontSize:15, fontWeight:700, color:'#F0F6FF' }}>FreightWatch</span>
        </div>

        <div style={{ display:'flex', gap:3, flex:1, overflow:'hidden' }}>
          {['all','vlcc','tanker','lng','lpg','bulk','container','chemical'].map(f => {
            const tc = VESSEL_TYPES[f];
            return (
              <button key={f} onClick={() => setFilter(f)} style={{ padding:'3px 7px', borderRadius:20, fontSize:10, fontWeight:500, cursor:'pointer', border:'none', background: filter===f ? (tc?.color||'#3B82F6') : '#0F2040', color: filter===f ? '#fff' : '#64748B', whiteSpace:'nowrap', flexShrink:0 }}>
                {f==='all'?'All':tc?.label?.split(' ')[0]||f} <span style={{ opacity:0.6 }}>{counts[f]??counts.all}</span>
              </button>
            );
          })}
        </div>

        {/* SEARCH */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setSearchOpen(true); }}
            placeholder="Search..."
            style={{ background:'#0F2040', border:`2px solid ${q?'#3B82F6':'#1E3A5F'}`, borderRadius:8, padding:'5px 24px 5px 10px', fontSize:12, color:'#E2E8F0', outline:'none', width:140 }} />
          {q && <button onClick={() => { setSearch(''); setSearchOpen(false); }} style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer', fontSize:15, padding:0 }}>×</button>}
        </div>

        <div style={{ display:'flex', background:'#0F2040', borderRadius:7, padding:2, flexShrink:0 }}>
          <button onClick={() => setMode('demo')}
            style={{ border:'none', background: mode==='demo' ? '#1E3A5F' : 'none', padding:'5px 11px', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer', color: mode==='demo' ? '#F0F6FF' : '#64748B', display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#F59E0B', display:'inline-block' }} />
            Demo mode
          </button>
          <button onClick={() => setMode('live')}
            style={{ border:'none', background: mode==='live' ? '#1E3A5F' : 'none', padding:'5px 11px', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer', color: mode==='live' ? '#F0F6FF' : '#64748B', display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#10B981', display:'inline-block' }} />
            Live data
          </button>
        </div>
        <div style={{ fontSize:11, color: isLive?'#10B981':'#64748B', flexShrink:0, minWidth:90 }}>
          {dataSource}
        </div>

        {/* BUTTONS */}
        <button onClick={() => { setShowFlows(true); setShowAlerts(false); setShowMarket(false); setShowPorts(false); setShowSanctions(false); setShowESG(false); setSelectedId(null); }}
          style={{ background: showFlows?'rgba(148,163,184,0.12)':'transparent', border:`1px solid ${showFlows?'#475569':'#1E3A5F'}`, borderRadius:6, padding:'5px 11px', cursor:'pointer', color: showFlows?'#F0F6FF':'#94A3B8', fontSize:11, fontWeight:500, flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>
          Flows
        </button>
        <button onClick={() => { setShowESG(true); setShowAlerts(false); setShowMarket(false); setShowPorts(false); setShowSanctions(false); setShowFlows(false); setSelectedId(null); }}
          style={{ background: showESG?'rgba(148,163,184,0.12)':'transparent', border:`1px solid ${showESG?'#475569':'#1E3A5F'}`, borderRadius:6, padding:'5px 11px', cursor:'pointer', color: showESG?'#F0F6FF':'#94A3B8', fontSize:11, fontWeight:500, flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 3c.4 2.2.5 6-1.5 10C15.5 17.5 13 19.5 11 20Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 11 13 11 11"/></svg>
          ESG
        </button>
        <button onClick={() => { setShowSanctions(true); setShowAlerts(false); setShowMarket(false); setShowPorts(false); setShowFlows(false); setShowESG(false); setSelectedId(null); }}
          style={{ background: showSanctions?'rgba(148,163,184,0.12)':'transparent', border:`1px solid ${showSanctions?'#475569':'#1E3A5F'}`, borderRadius:6, padding:'5px 11px', cursor:'pointer', color: showSanctions?'#F0F6FF':'#94A3B8', fontSize:11, fontWeight:500, flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4z"/></svg>
          Sanctions
        </button>
        <button onClick={() => { setShowAlerts(true); setShowMarket(false); setShowPorts(false); setShowSanctions(false); setShowFlows(false); setShowESG(false); setSelectedId(null); }}
          style={{ background: showAlerts?'rgba(148,163,184,0.12)':'transparent', border:`1px solid ${showAlerts?'#475569':'#1E3A5F'}`, borderRadius:6, padding:'5px 11px', cursor:'pointer', color: showAlerts?'#F0F6FF':'#94A3B8', fontSize:11, fontWeight:500, flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.27 6.96 19 11l-4.04 8.73a2 2 0 0 1-3.65-1.65l1.4-3.04"/><path d="M2.6 9.5a4 4 0 1 1 7.95-1 4 4 0 0 1-7.95 1Z" transform="rotate(0)"/><circle cx="6" cy="5.5" r="3.5"/></svg>
          Alerts{unreadAlerts>0 && <span style={{ background:'#DC2626', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:4, lineHeight:1.4 }}>{unreadAlerts}</span>}
        </button>
        <button onClick={() => { setShowMarket(true); setShowAlerts(false); setShowPorts(false); setShowSanctions(false); setShowFlows(false); setShowESG(false); setSelectedId(null); }}
          style={{ background: showMarket?'rgba(148,163,184,0.12)':'transparent', border:`1px solid ${showMarket?'#475569':'#1E3A5F'}`, borderRadius:6, padding:'5px 11px', cursor:'pointer', color: showMarket?'#F0F6FF':'#94A3B8', fontSize:11, fontWeight:500, flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
          Markets
        </button>
        <button onClick={() => { setShowPorts(true); setShowAlerts(false); setShowMarket(false); setShowSanctions(false); setShowFlows(false); setShowESG(false); setSelectedId(null); }}
          style={{ background: showPorts?'rgba(148,163,184,0.12)':'transparent', border:`1px solid ${showPorts?'#475569':'#1E3A5F'}`, borderRadius:6, padding:'5px 11px', cursor:'pointer', color: showPorts?'#F0F6FF':'#94A3B8', fontSize:11, fontWeight:500, flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4.5 8-11.8A8 8 0 0 0 4 10.2C4 17.5 12 22 12 22Z"/><circle cx="12" cy="10" r="3"/></svg>
          Ports
        </button>
      </div>

      {/* SEARCH RESULTS DROPDOWN */}
      {q && searchOpen && (
        <div style={{ position:'fixed', top:58, left:'50%', transform:'translateX(-50%)', width:460, maxHeight:440, overflowY:'auto', background:'#0B1829', border:'2px solid #3B82F6', borderRadius:12, zIndex:999999, boxShadow:'0 20px 60px rgba(0,0,0,0.97)' }}>
          {!hasResults && <div style={{ padding:20, textAlign:'center', color:'#64748B', fontSize:13 }}>No results for "{search}"</div>}
          {srVessels.length > 0 && <>
            <div style={{ padding:'8px 14px 4px', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', background:'#0F2040' }}>Vessels</div>
            {srVessels.map(v => {
              const tc = VESSEL_TYPES[v.type]||{};
              return <div key={v.id} onClick={() => { setSelectedId(v.id); setShowAlerts(false); setShowMarket(false); setShowPorts(false); setShowSanctions(false); setShowFlows(false); setShowESG(false); setSearch(''); setSearchOpen(false); }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', cursor:'pointer', borderBottom:'1px solid #0F2040' }}
                onMouseEnter={e=>e.currentTarget.style.background='#1E3A5F'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:tc.color||'#94A3B8', flexShrink:0 }}/>
                <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:600, color:'#F0F6FF' }}>{v.name}</div><div style={{ fontSize:11, color:'#64748B' }}>{tc.label} · {v.flag} · {v.imo} · → {v.dest}</div></div>
                <span style={{ fontSize:12, color:'#10B981', fontWeight:700 }}>Open →</span>
              </div>;
            })}
          </>}
          {srPorts.length > 0 && <>
            <div style={{ padding:'8px 14px 4px', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', background:'#0F2040' }}>Ports</div>
            {srPorts.map(p => <div key={p.id} onClick={() => { setHighlightPortId(p.id); setShowPorts(true); setShowAlerts(false); setShowMarket(false); setShowSanctions(false); setShowFlows(false); setShowESG(false); setSelectedId(null); setSearch(''); setSearchOpen(false); }}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', cursor:'pointer', borderBottom:'1px solid #0F2040' }}
              onMouseEnter={e=>e.currentTarget.style.background='#1E3A5F'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ width:9, height:9, borderRadius:2, background:'#3B82F6', flexShrink:0 }}/>
              <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:600, color:'#F0F6FF' }}>{p.name}</div><div style={{ fontSize:11, color:'#64748B' }}>{p.city}</div></div>
              <span style={{ fontSize:12, color:'#3B82F6', fontWeight:700 }}>Open →</span>
            </div>)}
          </>}
          {srStraits.length > 0 && <>
            <div style={{ padding:'8px 14px 4px', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', background:'#0F2040' }}>Straits</div>
            {srStraits.map(c => <div key={c.id} onClick={() => { setHighlightChokepoint(c.id); setShowAlerts(true); setShowMarket(false); setShowPorts(false); setShowSanctions(false); setShowFlows(false); setShowESG(false); setSelectedId(null); setSearch(''); setSearchOpen(false); }}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', cursor:'pointer', borderBottom:'1px solid #0F2040' }}
              onMouseEnter={e=>e.currentTarget.style.background='#1E3A5F'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ width:9, height:9, borderRadius:2, background:'#F59E0B', flexShrink:0 }}/>
              <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:600, color:'#F0F6FF' }}>{c.name}</div><div style={{ fontSize:11, color:'#64748B' }}>{c.dailyOil}</div></div>
              <span style={{ fontSize:12, color:'#F59E0B', fontWeight:700 }}>View →</span>
            </div>)}
          </>}
        </div>
      )}

      {/* KPI STRIP */}
      <div style={{ display:'flex', alignItems:'center', gap:0, padding:'8px 18px', background:'#0A1422', borderBottom:'1px solid #14253D', flexShrink:0 }}>
        {[
          { label:'Vessels tracked', value:vessels.length, color:'#94A3B8' },
          { label:'Active alerts', value:unreadAlerts, color: unreadAlerts>0 ? '#DC2626' : '#94A3B8' },
          { label:'Sanctioned vessels in DB', value:SANCTIONED_VESSELS.length, color:'#94A3B8' },
          { label:'Chokepoints monitored', value:CHOKEPOINTS.length, color:'#94A3B8' },
        ].map((kpi, i) => (
          <div key={i} style={{ display:'flex', alignItems:'baseline', gap:6, paddingRight:24, marginRight:24, borderRight: i<3 ? '1px solid #14253D' : 'none' }}>
            <span style={{ fontSize:14, fontWeight:700, color:kpi.color }}>{kpi.value}</span>
            <span style={{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'0.04em' }}>{kpi.label}</span>
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <div style={{ flex:1, position:'relative' }}>
          <MapCanvas vessels={vessels} positions={positions} selectedId={selectedId}
            highlightPortId={highlightPortId} searchOpen={false}
            onSelectVessel={id => { setSelectedId(id); setShowAlerts(false); setShowMarket(false); setShowPorts(false); setShowSanctions(false); setShowFlows(false); setShowESG(false); }}
            onSelectPort={id => { setHighlightPortId(id); setShowPorts(true); setShowAlerts(false); setShowMarket(false); setShowSanctions(false); setShowFlows(false); setShowESG(false); setSelectedId(null); }}
            onSelectChokepoint={id => { setHighlightChokepoint(id); setShowAlerts(true); setShowMarket(false); setShowPorts(false); setShowSanctions(false); setShowFlows(false); setShowESG(false); setSelectedId(null); }}
          />
          <div style={{ position:'absolute', bottom:14, left:14, background:'rgba(11,24,41,0.92)', border:'1px solid #1E3A5F', borderRadius:8, padding:'6px 12px', fontSize:11, color:'#64748B', zIndex:10 }}>
            {vessels.length} vessels · click any vessel or port for details
          </div>
        </div>

        {rightContent && (
          <div style={{ width:400, flexShrink:0, borderLeft:'1px solid #1E3A5F', overflow:'hidden', display:'flex', flexDirection:'column' }}>
            {rightContent==='vessel'    && <VesselDetail vessel={selectedVessel} position={positions[selectedId]} onClose={() => setSelectedId(null)} />}
            {rightContent==='alerts'    && <AlertsPanel alerts={alerts} highlightChokepoint={highlightChokepoint} onClose={() => setShowAlerts(false)} />}
            {rightContent==='market'    && <MarketPanel onClose={() => setShowMarket(false)} />}
            {rightContent==='flows'     && <CommodityFlows onClose={() => setShowFlows(false)} />}
            {rightContent==='esg'       && <ESGPanel onSelectVessel={id => { setSelectedId(id); setShowESG(false); }} onClose={() => setShowESG(false)} />}
            {rightContent==='ports'     && <PortPanel highlightPortId={highlightPortId} onSelectPort={setHighlightPortId} vessels={vessels} positions={positions} onSelectVessel={id => { setSelectedId(id); setShowPorts(false); }} onClose={() => { setShowPorts(false); setHighlightPortId(null); }} />}
            {rightContent==='sanctions' && <SanctionsPanel vessels={vessels} onSelectVessel={id => { setSelectedId(id); setShowSanctions(false); }} onClose={() => setShowSanctions(false)} />}
          </div>
        )}
      </div>
    </div>
  );
}
