import React from 'react';
import { PORTS } from '../data/ports';
import { CHOKEPOINTS } from '../data/chokepoints';
import { VESSEL_TYPES } from '../data/vessels';

export default function SearchResults({ query, vessels, onSelectVessel, onSelectPort, onSelectChokepoint, onClose }) {
  if (!query || !query.trim()) return null;
  const q = query.trim().toLowerCase();

  const matchedPorts = PORTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.city.toLowerCase().includes(q) ||
    p.country.toLowerCase().includes(q) ||
    p.id.toLowerCase().includes(q) ||
    p.commodities.some(c => c.toLowerCase().includes(q)) ||
    p.operators.some(o => o.toLowerCase().includes(q)) ||
    p.buyers.some(b => b.name.toLowerCase().includes(q) || b.commodity.toLowerCase().includes(q))
  );

  const matchedStraits = CHOKEPOINTS.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q) ||
    c.countries.toLowerCase().includes(q) ||
    c.id.toLowerCase().includes(q)
  );

  const matchedVessels = vessels.filter(v =>
    (v.name||'').toLowerCase().includes(q) ||
    (v.flag||'').toLowerCase().includes(q) ||
    (v.cargo||'').toLowerCase().includes(q) ||
    (v.dest||'').toLowerCase().includes(q) ||
    (v.imo||'').toLowerCase().includes(q)
  ).slice(0, 5);

  const total = matchedPorts.length + matchedStraits.length + matchedVessels.length;

  return (
    <div style={{
      position:'fixed', top:60, left:'auto',
      background:'#0B1829', border:'1px solid #3B82F6',
      borderRadius:12, zIndex:9999,
      boxShadow:'0 12px 40px rgba(0,0,0,0.9)',
      width:380, maxHeight:480, overflowY:'auto',
    }}>
      {total === 0 ? (
        <div style={{ padding:'20px', textAlign:'center', color:'#475569', fontSize:13 }}>
          No results for "<span style={{ color:'#94A3B8' }}>{query}</span>"
        </div>
      ) : (
        <>
          {matchedPorts.length > 0 && (
            <Section label={`Ports (${matchedPorts.length})`}>
              {matchedPorts.map(p => (
                <ResultRow
                  key={p.id}
                  icon={<span style={{ fontSize:20 }}>{p.icon}</span>}
                  title={p.name}
                  sub={`${p.city} · ${p.annualThroughput}`}
                  tag={p.commodities[0]}
                  tagColor="#F59E0B"
                  onClick={() => { onSelectPort(p.id); onClose(); }}
                />
              ))}
            </Section>
          )}

          {matchedStraits.length > 0 && (
            <Section label={`Chokepoints (${matchedStraits.length})`}>
              {matchedStraits.map(c => (
                <ResultRow
                  key={c.id}
                  icon={<span style={{ fontSize:20 }}>{c.icon}</span>}
                  title={c.name}
                  sub={`${c.dailyOil} · ${c.countries}`}
                  tag={c.importance}
                  tagColor={c.importanceColor}
                  onClick={() => { onSelectChokepoint(c.id); onClose(); }}
                />
              ))}
            </Section>
          )}

          {matchedVessels.length > 0 && (
            <Section label={`Vessels (${matchedVessels.length})`}>
              {matchedVessels.map(v => {
                const tc = VESSEL_TYPES[v.type] || {};
                return (
                  <ResultRow
                    key={v.id}
                    icon={<span style={{ width:10, height:10, borderRadius:'50%', background:tc.color||'#94A3B8', display:'inline-block' }}></span>}
                    title={v.name}
                    sub={`${tc.label||v.type} · ${v.flag||''} · → ${v.dest||''}`}
                    tag={v.cargo}
                    tagColor={tc.color}
                    onClick={() => { onSelectVessel(v.id); onClose(); }}
                  />
                );
              })}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <div style={{ padding:'10px 14px 4px', fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', background:'#0F2040' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function ResultRow({ icon, title, sub, tag, tagColor, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #0F2040', transition:'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background='#1E3A5F'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}
    >
      <div style={{ width:28, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#F0F6FF', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{title}</div>
        <div style={{ fontSize:11, color:'#64748B', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{sub}</div>
      </div>
      {tag && (
        <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:`${tagColor||'#3B82F6'}20`, color:tagColor||'#3B82F6', fontWeight:600, flexShrink:0, whiteSpace:'nowrap' }}>
          {tag}
        </span>
      )}
    </div>
  );
}
