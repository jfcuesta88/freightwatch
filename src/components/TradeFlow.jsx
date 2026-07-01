import React from 'react';
import { findPort, inferBuyers, inferOriginPort, inferDestPort, getVoyageDays, formatValue } from '../data/tradeRoutes';
import { VESSEL_TYPES } from '../data/vessels';

function Step({ number, color, label, content, sub, isLast }) {
  return (
    <div style={{ display:'flex', gap:12, position:'relative' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:`${color}20`, border:`2px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color, zIndex:1 }}>{number}</div>
        {!isLast && <div style={{ width:2, flex:1, background:'#1E3A5F', margin:'4px 0', minHeight:24 }} />}
      </div>
      <div style={{ flex:1, paddingBottom: isLast ? 0 : 16, paddingTop:4 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:13, fontWeight:600, color:'#E2E8F0' }}>{content}</div>
        {sub && <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function TradeFlow({ vessel }) {
  const tc = VESSEL_TYPES[vessel.type] || {};
  const ce = vessel.cargoEstimate;

  const originPort = inferOriginPort(vessel);
  const destPort   = inferDestPort(vessel);
  const buyers     = inferBuyers(destPort, vessel.cargo);
  const voyageDays = originPort && destPort ? getVoyageDays(originPort.id, destPort.id) : null;

  const originName  = originPort?.name || vessel.lastPort || 'Unknown origin';
  const destName    = destPort?.name   || vessel.dest     || 'Unknown destination';
  const cargoValue  = ce ? formatValue(ce.estimatedValue) : '—';
  const cargoQty    = ce ? `${(ce.estimatedUnits/1000).toFixed(0)}K ${ce.unit}` : '—';

  return (
    <div style={{ padding:'12px 16px' }}>

      {/* Trade flow summary card */}
      <div style={{ background:'#0F2040', border:`1px solid ${tc.color||'#1E3A5F'}30`, borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Trade flow summary</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            { label:'Vessel', value: vessel.name, color:'#E2E8F0' },
            { label:'Cargo type', value: vessel.cargo || tc.commodity || '—', color:'#E2E8F0' },
            { label:'Est. quantity', value: cargoQty, color:'#E2E8F0' },
            { label:'Est. cargo value', value: cargoValue, color:'#10B981' },
            { label:'Load status', value: ce?.status || '—', color: ce?.loaded ? '#10B981' : ce?.partial ? '#F59E0B' : '#64748B' },
            { label:'Voyage est.', value: voyageDays ? `~${voyageDays} days` : 'Calculating...', color:'#93C5FD' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background:'#0a1628', borderRadius:8, padding:'7px 10px' }}>
              <div style={{ fontSize:10, color:'#475569', marginBottom:2 }}>{label}</div>
              <div style={{ fontSize:12, fontWeight:600, color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trade flow steps */}
      <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>Trade journey</div>

      <Step number="1" color="#F59E0B" label="Origin / loading port"
        content={originName}
        sub={originPort ? `${originPort.annualThroughput} · ${originPort.country}` : vessel.lastPort ? `Last known port` : 'AIS data pending'}
      />
      <Step number="2" color={tc.color||'#3B82F6'} label="Vessel in transit"
        content={`${vessel.name} — ${tc.label||vessel.type}`}
        sub={`${vessel.speed?.toFixed(1)} knots · ${vessel.heading||0}° heading · Draught: ${vessel.draught}`}
      />
      <Step number="3" color="#8B5CF6" label="Cargo on board"
        content={`${vessel.cargo || tc.commodity || 'Unknown cargo'}`}
        sub={`${cargoQty} · Est. value ${cargoValue} · Load factor: ${ce?.loadFactor||'—'}%`}
      />
      <Step number="4" color="#10B981" label="Destination port"
        content={destName}
        sub={destPort ? `${destPort.annualThroughput} · ${destPort.country}` : `Destination: ${vessel.dest || 'Unknown'}`}
        isLast={buyers.length === 0}
      />

      {/* Likely buyers */}
      {buyers.length > 0 && (
        <Step number="5" color="#EF4444" label="Likely buyers at destination"
          content="Trade finance targets"
          sub={null}
          isLast
        />
      )}

      {buyers.length > 0 && (
        <div style={{ marginLeft:44, marginTop:-8 }}>
          {buyers.map((buyer, i) => (
            <div key={i} style={{ padding:'10px 12px', marginBottom:8, background:'#0F2040', borderRadius:9, border:'1px solid #1E3A5F' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#E2E8F0', flex:1, paddingRight:8 }}>{buyer.name}</div>
                {buyer.ticker && !['Private','Various'].includes(buyer.ticker) && (
                  <span style={{ fontSize:10, padding:'2px 6px', borderRadius:6, background:'#1E3A5F', color:'#93C5FD', fontWeight:600, flexShrink:0 }}>{buyer.ticker}</span>
                )}
              </div>
              <div style={{ display:'flex', gap:5, marginBottom:3, flexWrap:'wrap' }}>
                <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10, background:'rgba(245,158,11,0.15)', color:'#F59E0B' }}>{buyer.commodity}</span>
                <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10, background:'#1E3A5F', color:'#64748B' }}>{buyer.volume}</span>
              </div>
              <div style={{ fontSize:11, color:'#64748B' }}>{buyer.purpose}</div>
            </div>
          ))}
        </div>
      )}

      {/* Trade finance note */}
      <div style={{ marginTop:12, padding:'10px 12px', background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#3B82F6', marginBottom:4 }}>Trade finance context</div>
        <div style={{ fontSize:11, color:'#64748B', lineHeight:1.6 }}>
          Cargo estimated at <span style={{ color:'#10B981', fontWeight:600 }}>{cargoValue}</span> in transit.
          {voyageDays && ` Voyage ~${voyageDays} days.`}
          {buyers.length > 0 && ` Likely off-takers at ${destName}: ${buyers.map(b => b.name.split(' ')[0]).join(', ')}.`}
          {' '}Data inferred from AIS + port intelligence. Confirm with bill of lading for financing.
        </div>
      </div>

      <div style={{ fontSize:10, color:'#334155', marginTop:8, textAlign:'center' }}>
        Estimates only · Connect Kpler or Vortexa for confirmed manifests
      </div>
    </div>
  );
}
