import React, { useState } from 'react';
import { VESSEL_TYPES, COMMODITIES } from '../data/vessels';

const FILTERS = [
  { key:'all',       label:'All freight' },
  { key:'vlcc',      label:'VLCC' },
  { key:'tanker',    label:'Tankers' },
  { key:'lng',       label:'LNG' },
  { key:'lpg',       label:'LPG' },
  { key:'bulk',      label:'Bulk' },
  { key:'container', label:'Container' },
  { key:'chemical',  label:'Chemical' },
];

function formatValue(val) {
  if (val >= 1e9) return `$${(val/1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val/1e6).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
}

export default function Sidebar({ vessels, positions, filter, setFilter, selectedId, setSelectedId, searchQuery, setSearchQuery, counts, alerts }) {
  const [tab, setTab] = useState('vessels');

  const totalValue = vessels.reduce((sum, v) => sum + (v.cargoEstimate?.estimatedValue || 0), 0);

  return (
    <div style={{ width:340, flexShrink:0, background:'#0B1829', borderRight:'1px solid #1E3A5F', display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'16px 18px 12px', borderBottom:'1px solid #1E3A5F' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <rect width="30" height="30" rx="8" fill="#1E3A5F"/>
            <path d="M7 20l5-10 4 5 4-7 5 12H7z" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
            <circle cx="23" cy="8" r="2.5" fill="#10B981"/>
          </svg>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#F0F6FF', letterSpacing:'-0.3px' }}>FreightWatch</div>
            <div style={{ fontSize:11, color:'#64748B' }}>Commercial cargo intelligence</div>
          </div>
        </div>

        {/* Total cargo value card */}
        <div style={{ background:'#0F2040', border:'1px solid #1E3A5F', borderRadius:8, padding:'10px 12px', marginBottom:10 }}>
          <div style={{ fontSize:11, color:'#64748B', marginBottom:2 }}>Tracked cargo value (est.)</div>
          <div style={{ fontSize:22, fontWeight:700, color:'#10B981' }}>{formatValue(totalValue)}</div>
          <div style={{ fontSize:11, color:'#475569', marginTop:1 }}>{vessels.length} vessels · live positions</div>
        </div>

        {/* Search */}
        <div style={{ position:'relative' }}>
          <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', opacity:0.4 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search vessel, cargo, route..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width:'100%', background:'#0F2040', border:'1px solid #1E3A5F', borderRadius:7, padding:'7px 10px 7px 30px', fontSize:13, color:'#CBD5E1', outline:'none', boxSizing:'border-box' }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid #1E3A5F' }}>
        {[['vessels','Fleet'], ['alerts',`Alerts${alerts.length > 0 ? ` (${alerts.length})` : ''}`], ['commodities','Markets']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex:1, padding:'9px 0', background:'none', border:'none', borderBottom: tab===key ? '2px solid #F59E0B' : '2px solid transparent', color: tab===key ? '#F59E0B' : '#64748B', fontSize:12, fontWeight: tab===key ? 600 : 400, cursor:'pointer', marginBottom:-1 }}>{label}</button>
        ))}
      </div>

      {tab === 'vessels' && <>
        {/* Type filters */}
        <div style={{ display:'flex', gap:5, padding:'8px 12px', flexWrap:'wrap', borderBottom:'1px solid #1E3A5F' }}>
          {FILTERS.map(f => {
            const tc = VESSEL_TYPES[f.key];
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:500, cursor:'pointer', border: filter===f.key ? 'none' : '1px solid #1E3A5F', background: filter===f.key ? (tc?.bg || '#1E3A5F') : 'transparent', color: filter===f.key ? (tc?.color || '#93C5FD') : '#64748B' }}>
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Vessel list */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {vessels.map(v => {
            const tc = VESSEL_TYPES[v.type] || { color:'#94A3B8', bg:'rgba(148,163,184,0.15)', label:v.type||'Vessel' };
            const ce = v.cargoEstimate;
            const com = COMMODITIES[v.cargo] || {};
            const isSelected = selectedId === v.id;
            return (
              <div key={v.id} onClick={() => setSelectedId(isSelected ? null : v.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid #0F2040', cursor:'pointer', background: isSelected ? '#0F2040' : 'transparent' }}>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.03em', color: com.color||'#94A3B8', background:`${com.color||'#94A3B8'}18`, padding:'3px 6px', borderRadius:4, flexShrink:0 }}>{com.icon || 'CGO'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#E2E8F0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v.name}</div>
                  <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>{v.cargo} · {v.flag}</div>
                  <div style={{ fontSize:11, color:'#475569', marginTop:1 }}>{v.route}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#10B981' }}>{formatValue(ce?.estimatedValue || 0)}</div>
                  <div style={{ fontSize:10, color: ce?.loaded ? '#10B981' : ce?.partial ? '#F59E0B' : '#64748B', marginTop:2 }}>{ce?.status}</div>
                </div>
              </div>
            );
          })}
          {vessels.length === 0 && <div style={{ padding:32, textAlign:'center', color:'#475569', fontSize:13 }}>No vessels match</div>}
        </div>
      </>}

      {tab === 'alerts' && (
        <div style={{ flex:1, overflowY:'auto' }}>
          {alerts.length === 0 && <div style={{ padding:32, textAlign:'center', color:'#475569', fontSize:13 }}>Zone alerts appear here in real time</div>}
          {alerts.map(a => {
            const tc = VESSEL_TYPES[a.type] || {};
            return (
              <div key={a.id} style={{ padding:'11px 14px', borderBottom:'1px solid #0F2040' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background: tc.color || '#F59E0B' }} />
                  <span style={{ fontSize:12, fontWeight:600, color:'#E2E8F0' }}>{a.vesselName}</span>
                </div>
                <div style={{ fontSize:12, color:'#64748B' }}>Entered <span style={{ color:'#93C5FD' }}>{a.zone}</span></div>
                <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{a.time.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'commodities' && (
        <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>
          <div style={{ fontSize:11, color:'#475569', marginBottom:10 }}>Live commodity spot prices (est.)</div>
          {Object.entries(COMMODITIES).map(([name, c]) => (
            <div key={name} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderBottom:'1px solid #0F2040' }}>
              <span style={{ fontSize:18 }}>{c.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500, color:'#E2E8F0' }}>{name}</div>
                <div style={{ fontSize:11, color:'#64748B' }}>per {c.unit}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:'#F59E0B' }}>${c.pricePerUnit.toLocaleString()}</div>
            </div>
          ))}
          <div style={{ fontSize:10, color:'#334155', padding:'10px 4px' }}>Prices are estimates for illustration purposes.</div>
        </div>
      )}

      <div style={{ padding:'9px 14px', borderTop:'1px solid #1E3A5F', fontSize:11, color:'#334155', display:'flex', justifyContent:'space-between' }}>
        <span>FreightWatch v2.0</span>
        <span style={{ color:'#10B981' }}>● Simulation</span>
      </div>
    </div>
  );
}
