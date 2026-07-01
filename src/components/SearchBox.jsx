import React, { useState } from 'react';
import { VESSELS, VESSEL_TYPES } from '../data/vessels';
import { PORTS } from '../data/ports';
import { CHOKEPOINTS } from '../data/chokepoints';

export default function SearchBox({ onSelectVessel, onSelectPort, onSelectStrait }) {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const vessels = q ? VESSELS.filter(v =>
    v.name.toLowerCase().includes(q) ||
    (v.flag||'').toLowerCase().includes(q) ||
    (v.cargo||'').toLowerCase().includes(q) ||
    (v.dest||'').toLowerCase().includes(q) ||
    (v.type||'').toLowerCase().includes(q)
  ).slice(0, 6) : [];

  const ports = q ? PORTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.city.toLowerCase().includes(q) ||
    p.country.toLowerCase().includes(q)
  ).slice(0, 5) : [];

  const straits = q ? CHOKEPOINTS.filter(c =>
    c.name.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const hasResults = vessels.length + ports.length + straits.length > 0;

  function pick(fn, arg) {
    setQuery('');
    fn(arg);
  }

  return (
    <div style={{ flexShrink:0, position:'relative' }}>
      {/* Input */}
      <div style={{ position:'relative' }}>
        <svg style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', opacity:0.4, pointerEvents:'none' }}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search vessels, ports..."
          style={{ background:'#0F2040', border:`2px solid ${q ? '#3B82F6' : '#1E3A5F'}`,
            borderRadius:8, padding:'5px 26px 5px 22px', fontSize:12,
            color:'#E2E8F0', outline:'none', width:190 }}
        />
        {q && (
          <button onClick={() => setQuery('')}
            style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', color:'#94A3B8', cursor:'pointer', fontSize:16, padding:0 }}>
            ×
          </button>
        )}
      </div>

      {/* Results — rendered as a normal div below, no fixed/absolute tricks */}
      {q && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:'50%', transform:'translateX(-50%)',
          width:440, background:'#0B1829',
          border:'2px solid #3B82F6', borderRadius:12,
          boxShadow:'0 8px 40px rgba(0,0,0,0.95)',
          zIndex:9999999,
          overflowY:'auto', maxHeight:420,
        }}>
          {!hasResults && (
            <div style={{ padding:20, textAlign:'center', color:'#64748B', fontSize:13 }}>
              No results for "{query}"
            </div>
          )}

          {vessels.length > 0 && (
            <>
              <div style={{ padding:'8px 14px 2px', fontSize:10, fontWeight:700,
                color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em',
                background:'#0F2040' }}>
                Vessels
              </div>
              {vessels.map(v => {
                const tc = VESSEL_TYPES[v.type] || {};
                return (
                  <div key={v.id}
                    onClick={() => pick(onSelectVessel, v.id)}
                    style={{ display:'flex', alignItems:'center', gap:10,
                      padding:'11px 16px', cursor:'pointer',
                      borderBottom:'1px solid #0F2040' }}
                    onMouseEnter={e => e.currentTarget.style.background='#1E3A5F'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <div style={{ width:12, height:12, borderRadius:'50%',
                      background:tc.color||'#94A3B8', flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:'#F0F6FF' }}>{v.name}</div>
                      <div style={{ fontSize:11, color:'#64748B' }}>
                        {tc.label||v.type} · {v.flag} · → {v.dest}
                      </div>
                    </div>
                    <span style={{ fontSize:12, color:'#10B981', fontWeight:700 }}>Open →</span>
                  </div>
                );
              })}
            </>
          )}

          {ports.length > 0 && (
            <>
              <div style={{ padding:'8px 14px 2px', fontSize:10, fontWeight:700,
                color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em',
                background:'#0F2040' }}>
                Ports
              </div>
              {ports.map(p => (
                <div key={p.id}
                  onClick={() => pick(onSelectPort, p.id)}
                  style={{ display:'flex', alignItems:'center', gap:10,
                    padding:'11px 16px', cursor:'pointer',
                    borderBottom:'1px solid #0F2040' }}
                  onMouseEnter={e => e.currentTarget.style.background='#1E3A5F'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:20 }}>{p.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'#F0F6FF' }}>{p.name}</div>
                    <div style={{ fontSize:11, color:'#64748B' }}>{p.city} · {p.annualThroughput}</div>
                  </div>
                  <span style={{ fontSize:12, color:'#3B82F6', fontWeight:700 }}>Open →</span>
                </div>
              ))}
            </>
          )}

          {straits.length > 0 && (
            <>
              <div style={{ padding:'8px 14px 2px', fontSize:10, fontWeight:700,
                color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em',
                background:'#0F2040' }}>
                Straits
              </div>
              {straits.map(c => (
                <div key={c.id}
                  onClick={() => pick(onSelectStrait, c.id)}
                  style={{ display:'flex', alignItems:'center', gap:10,
                    padding:'11px 16px', cursor:'pointer',
                    borderBottom:'1px solid #0F2040' }}
                  onMouseEnter={e => e.currentTarget.style.background='#1E3A5F'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:20 }}>{c.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'#F0F6FF' }}>{c.name}</div>
                    <div style={{ fontSize:11, color:'#64748B' }}>{c.dailyOil}</div>
                  </div>
                  <span style={{ fontSize:12, color:'#F59E0B', fontWeight:700 }}>View →</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
