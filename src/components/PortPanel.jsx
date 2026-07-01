import React, { useState, useEffect } from 'react';
import { PORTS } from '../data/ports';
import { VESSEL_TYPES } from '../data/vessels';

const TYPE_COLORS = {
  oil_refining:{ label:'Oil Refining Hub',      color:'#F59E0B' },
  megaport:    { label:'Mega Port',             color:'#3B82F6' },
  oil_export:  { label:'Oil Export Terminal',   color:'#EF4444' },
  transhipment:{ label:'Transhipment Hub',      color:'#10B981' },
  container:   { label:'Container Port',        color:'#8B5CF6' },
  bulk_export: { label:'Bulk Export Terminal',  color:'#6B7280' },
  oil_hub:     { label:'Oil Trading Hub',       color:'#F97316' },
};

export default function PortPanel({ onClose, highlightPortId, onSelectPort, vessels, positions, onSelectVessel }) {
  const [selectedId, setSelectedId] = useState(highlightPortId || null);
  const [search, setSearch] = useState('');
  const selectedPort = selectedId ? PORTS.find(p => p.id === selectedId) : null;

  // Jump to port when highlighted from map click
  useEffect(() => {
    if (highlightPortId) setSelectedId(highlightPortId);
  }, [highlightPortId]);

  const filtered = PORTS.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase()) ||
    p.country.toLowerCase().includes(search.toLowerCase()) ||
    p.commodities.some(c => c.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (id) => {
    setSelectedId(id);
    onSelectPort?.(id);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#0B1829' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px 12px', borderBottom:'1px solid #1E3A5F', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: selectedId ? 0 : 10 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#F0F6FF' }}>World Ports</div>
            {!selectedId && <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>{PORTS.length} major ports · buyer intelligence</div>}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {selectedId && (
              <button onClick={() => { setSelectedId(null); onSelectPort?.(null); }} style={{ background:'#0F2040', border:'1px solid #1E3A5F', borderRadius:6, padding:'4px 10px', color:'#94A3B8', fontSize:11, cursor:'pointer' }}>
                ← All ports
              </button>
            )}
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', fontSize:20, cursor:'pointer' }}>×</button>
          </div>
        </div>

        {!selectedId && (
          <div style={{ position:'relative', marginTop:4 }}>
            <svg style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', opacity:0.4, pointerEvents:'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search ports, countries, commodities..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:'100%', background:'#0F2040', border:'1px solid #1E3A5F', borderRadius:8, padding:'7px 28px 7px 28px', fontSize:12, color:'#CBD5E1', outline:'none', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='#3B82F6'} onBlur={e => e.target.style.borderColor='#1E3A5F'} />
            {search && <button onClick={() => setSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:14 }}>×</button>}
          </div>
        )}
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {/* PORT LIST */}
        {!selectedPort && (
          <div>
            {filtered.map(port => {
              const tc = TYPE_COLORS[port.type] || { label: port.type, color:'#94A3B8' };
              const isHighlighted = highlightPortId === port.id;
              return (
                <div key={port.id} onClick={() => handleSelect(port.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom:'1px solid #0F2040', cursor:'pointer', background: isHighlighted ? 'rgba(239,68,68,0.08)' : 'transparent', borderLeft: isHighlighted ? '3px solid #EF4444' : '3px solid transparent' }}
                  onMouseEnter={e => !isHighlighted && (e.currentTarget.style.background='#0F2040')}
                  onMouseLeave={e => !isHighlighted && (e.currentTarget.style.background='transparent')}>
                  <span style={{ fontSize:22, flexShrink:0 }}>{port.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color: isHighlighted ? '#F0F6FF' : '#E2E8F0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{port.name}</div>
                    <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>{port.city}</div>
                    <div style={{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>
                      <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:`${tc.color}20`, color:tc.color }}>{tc.label}</span>
                      {port.commodities.slice(0,2).map(c => <span key={c} style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:'#1E3A5F', color:'#64748B' }}>{c.split(' ')[0]}</span>)}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:11, color:'#475569' }}>{port.annualThroughput}</div>
                    {isHighlighted
                      ? <div style={{ fontSize:11, color:'#EF4444', marginTop:2, fontWeight:600 }}>● Selected</div>
                      : <div style={{ fontSize:11, color:'#3B82F6', marginTop:2 }}>→</div>
                    }
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ padding:32, textAlign:'center', color:'#475569', fontSize:13 }}>No ports match "{search}"</div>}
          </div>
        )}

        {/* PORT DETAIL */}
        {selectedPort && <PortDetail port={selectedPort} vessels={vessels} positions={positions} onSelectVessel={onSelectVessel} />}
      </div>
    </div>
  );
}

function PortDetail({ port, vessels, positions, onSelectVessel }) {
  const tc = TYPE_COLORS[port.type] || { label: port.type, color:'#94A3B8' };

  // Find vessels heading to this port
  const inbound = (vessels || []).filter(v => {
    const dest = (v.dest || '').toLowerCase();
    const route = (v.route || '').toLowerCase();
    const portName = port.name.toLowerCase();
    const portCity = port.city.toLowerCase().split(',')[0];
    const portId = port.id.toLowerCase().replace(/_/g, ' ');
    return dest.includes(portCity) || dest.includes(portId) ||
           route.includes(portCity) || route.includes(portId) ||
           portName.includes(dest) || dest.includes(port.country.toLowerCase());
  }).slice(0, 5);

  // Find vessels near this port
  const nearby = (vessels || []).filter(v => {
    const pos = positions?.[v.id];
    if (!pos) return false;
    const dist = Math.sqrt((pos.lat - port.lat)**2 + (pos.lng - port.lng)**2);
    return dist < 6;
  }).slice(0, 5);

  const allVessels = [...new Map([...inbound, ...nearby].map(v => [v.id, v])).values()];

  function fmtVal(val) {
    if (!val) return '—';
    if (val >= 1e9) return `$${(val/1e9).toFixed(1)}B`;
    if (val >= 1e6) return `$${(val/1e6).toFixed(0)}M`;
    return `$${val.toLocaleString()}`;
  }
  return (
    <div>
      <div style={{ padding:'14px 16px', borderBottom:'1px solid #1E3A5F', background:'#0F2040' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <span style={{ fontSize:28 }}>{port.icon}</span>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#F0F6FF' }}>{port.name}</div>
            <div style={{ fontSize:12, color:'#64748B' }}>{port.city}</div>
          </div>
        </div>
        <span style={{ fontSize:11, padding:'3px 9px', borderRadius:20, background:`${tc.color}20`, color:tc.color, fontWeight:600 }}>{tc.label}</span>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
          <div style={{ background:'#0a1628', borderRadius:8, padding:'8px 10px' }}>
            <div style={{ fontSize:10, color:'#475569' }}>Annual throughput</div>
            <div style={{ fontSize:13, fontWeight:700, color:'#E2E8F0' }}>{port.annualThroughput}</div>
          </div>
          <div style={{ background:'#0a1628', borderRadius:8, padding:'8px 10px' }}>
            <div style={{ fontSize:10, color:'#475569' }}>Main operator</div>
            <div style={{ fontSize:11, color:'#E2E8F0' }}>{port.operators[0]}</div>
          </div>
        </div>
      </div>

      <div style={{ padding:'12px 16px', borderBottom:'1px solid #1E3A5F' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Commodities handled</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {port.commodities.map(c => <span key={c} style={{ fontSize:12, padding:'4px 10px', borderRadius:20, background:'#0F2040', border:'1px solid #1E3A5F', color:'#CBD5E1' }}>{c}</span>)}
        </div>
      </div>

      <div style={{ padding:'12px 16px', borderBottom:'1px solid #1E3A5F' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>🏭 Who buys what here</div>
        {port.buyers.map((buyer, i) => (
          <div key={i} style={{ padding:'10px 12px', marginBottom:8, background:'#0F2040', borderRadius:9, border:'1px solid #1E3A5F' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#E2E8F0', flex:1, paddingRight:8 }}>{buyer.name}</div>
              {buyer.ticker && !['Private','Various'].includes(buyer.ticker) && (
                <span style={{ fontSize:10, padding:'2px 6px', borderRadius:6, background:'#1E3A5F', color:'#93C5FD', fontWeight:600, flexShrink:0 }}>{buyer.ticker}</span>
              )}
            </div>
            <div style={{ display:'flex', gap:5, marginBottom:4, flexWrap:'wrap' }}>
              <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10, background:'rgba(245,158,11,0.15)', color:'#F59E0B' }}>{buyer.commodity}</span>
              <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10, background:'#1E3A5F', color:'#64748B' }}>{buyer.volume}</span>
            </div>
            <div style={{ fontSize:11, color:'#64748B' }}>{buyer.purpose}</div>
          </div>
        ))}
      </div>

      {/* Inbound vessels */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #1E3A5F' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
          Vessels inbound / nearby
          {allVessels.length > 0 && <span style={{ color:'#10B981', marginLeft:6 }}>● {allVessels.length} tracked</span>}
        </div>
        {allVessels.length === 0 ? (
          <div style={{ fontSize:12, color:'#334155', padding:'8px 0' }}>No vessels currently tracked inbound — connect AIS API for live data</div>
        ) : allVessels.map(v => {
          const vt = VESSEL_TYPES[v.type] || {};
          const ce = v.cargoEstimate;
          return (
            <div key={v.id} onClick={() => onSelectVessel && onSelectVessel(v.id)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', marginBottom:6, background:'#0F2040', borderRadius:9, border:'1px solid #1E3A5F', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor=vt.color||'#3B82F6'}
              onMouseLeave={e => e.currentTarget.style.borderColor='#1E3A5F'}>
              <div style={{ width:9, height:9, borderRadius:'50%', background:vt.color||'#94A3B8', flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#E2E8F0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v.name}</div>
                <div style={{ fontSize:11, color:'#64748B' }}>{vt.label||v.type} · {v.cargo||'—'}</div>
                <div style={{ fontSize:11, color:'#475569' }}>{v.flag} · {v.speed?.toFixed(1)} kts</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#10B981' }}>{fmtVal(ce?.estimatedValue)}</div>
                <div style={{ fontSize:10, color: ce?.loaded?'#10B981':ce?.partial?'#F59E0B':'#64748B' }}>{ce?.status||'—'}</div>
                <div style={{ fontSize:10, color:'#3B82F6', marginTop:2 }}>View details →</div>
              </div>
            </div>
          );
        })}
        {allVessels.length > 0 && (
          <div style={{ fontSize:11, color:'#475569', marginTop:6, padding:'6px 10px', background:'#0F2040', borderRadius:8 }}>
            Total inbound cargo est.: <span style={{ color:'#10B981', fontWeight:700 }}>{fmtVal(allVessels.reduce((sum, v) => sum + (v.cargoEstimate?.estimatedValue||0), 0))}</span>
          </div>
        )}
      </div>

      <div style={{ padding:'12px 16px', borderBottom:'1px solid #1E3A5F' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Recent arrivals</div>
        {port.recentArrivals.map((name, i) => (
          <div key={i} style={{ fontSize:12, color:'#94A3B8', padding:'5px 0', borderBottom:'1px solid #0F2040' }}>{name}</div>
        ))}
      </div>

      <div style={{ margin:'12px 14px 14px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:10, padding:'12px 14px' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#3B82F6', marginBottom:5 }}>Did you know?</div>
        <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.6 }}>{port.funFact}</div>
      </div>
    </div>
  );
}
