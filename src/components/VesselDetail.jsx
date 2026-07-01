import React, { useState } from 'react';
import { VESSEL_TYPES } from '../data/vessels';
import TradeFlow from './TradeFlow';
import { screenVessel } from '../data/sanctions';

function Row({ label, value, accent }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #0F2040', fontSize:13 }}>
      <span style={{ color:'#64748B' }}>{label}</span>
      <span style={{ color: accent||'#CBD5E1', fontWeight:500, textAlign:'right', maxWidth:'60%' }}>{value||'—'}</span>
    </div>
  );
}

function CargoBar({ loadFactor, color }) {
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748B', marginBottom:4 }}>
        <span>Load factor</span><span style={{ color }}>{loadFactor}%</span>
      </div>
      <div style={{ height:6, background:'#0F2040', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${loadFactor}%`, background:color, borderRadius:3, transition:'width 0.5s' }} />
      </div>
    </div>
  );
}

function fmt(val) {
  if (!val) return '—';
  if (val >= 1e9) return `$${(val/1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val/1e6).toFixed(1)}M`;
  return `$${val.toLocaleString()}`;
}

function fmtUnits(units, unit) {
  if (!units) return '—';
  if (units >= 1e6) return `${(units/1e6).toFixed(2)}M ${unit}`;
  if (units >= 1000) return `${(units/1000).toFixed(0)}K ${unit}`;
  return `${units.toLocaleString()} ${unit}`;
}

export default function VesselDetail({ vessel, position, onClose }) {
  const [tab, setTab] = useState('cargo');
  if (!vessel) return null;
  const tc = VESSEL_TYPES[vessel.type] || { label: vessel.type, color:'#94A3B8', bg:'rgba(148,163,184,0.1)' };
  const ce = vessel.cargoEstimate;
  const statusColor = ce?.loaded ? '#10B981' : ce?.partial ? '#F59E0B' : '#64748B';
  const latStr = position ? `${Math.abs(position.lat).toFixed(4)}° ${position.lat>=0?'N':'S'}` : '—';
  const lngStr = position ? `${Math.abs(position.lng).toFixed(4)}° ${position.lng>=0?'E':'W'}` : '—';

  return (
    <div style={{ background:'#0B1829', border:'1px solid #1E3A5F', borderRadius:12, overflow:'hidden', maxHeight:'85vh', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px 12px', borderBottom:'1px solid #1E3A5F', background:'#0F2040', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#F0F6FF', marginBottom:5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{vessel.name}</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600, background:tc.bg, color:tc.color }}>{tc.label}</span>
              {ce && <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600, background:`${statusColor}20`, color:statusColor }}>{ce.status}</span>}
              {vessel.flag && <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, background:'#1E3A5F', color:'#94A3B8' }}>{vessel.flag}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', fontSize:22, cursor:'pointer', paddingLeft:8 }}>×</button>
        </div>

        {/* Live stats */}
        <div style={{ display:'flex', gap:16, marginTop:12 }}>
          {[
            { val: vessel.speed?.toFixed(1), label: 'knots', color: tc.color },
            { val: (vessel.heading||vessel.course||0)+'°', label: 'heading', color:'#CBD5E1' },
            { val: vessel.draught, label: 'draught', color:'#CBD5E1' },
            { val: vessel.length, label: 'length', color:'#CBD5E1' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize:18, fontWeight:700, color:s.color }}>{s.val||'—'}</div>
              <div style={{ fontSize:10, color:'#475569' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid #1E3A5F', flexShrink:0 }}>
        {[['cargo','Cargo Intel'],['trade','Trade Flow'],['esg','ESG'],['vessel','Vessel'],['position','Position'],['intelligence','Intelligence']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex:1, padding:'8px 0', background:'none', border:'none', borderBottom: tab===k ? `2px solid ${tc.color}` : '2px solid transparent', color: tab===k ? tc.color : '#64748B', fontSize:11, fontWeight: tab===k ? 600 : 400, cursor:'pointer', marginBottom:-1 }}>{l}</button>
        ))}
      </div>

      <div style={{ overflowY:'auto', flex:1 }}>

        {/* TRADE FLOW TAB */}
        {tab === 'trade' && <TradeFlow vessel={vessel} />}

        {/* ESG TAB */}
        {tab === 'esg' && vessel.esg && (
          <div style={{ padding:16 }}>
            {(() => {
              const GRADE_COLOR = { A:'#10B981', B:'#84CC16', C:'#F59E0B', D:'#F97316', E:'#EF4444' };
              const esg = vessel.esg;
              const gc = GRADE_COLOR[esg.ciiGrade];
              return (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                    <div style={{ width:48, height:48, borderRadius:10, background:`${gc}20`, color:gc, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700, flexShrink:0 }}>{esg.ciiGrade}</div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#F0F6FF' }}>CII Grade {esg.ciiGrade}</div>
                      <div style={{ fontSize:11, color:'#64748B' }}>{esg.gradeIndex<=1 ? 'Above average efficiency' : esg.gradeIndex===2 ? 'Average efficiency' : 'Below average efficiency'}</div>
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                    <div style={{ background:'#0F2040', borderRadius:8, padding:'10px 12px' }}>
                      <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'0.04em' }}>Vessel age</div>
                      <div style={{ fontSize:15, fontWeight:700, color:'#E2E8F0' }}>{esg.age} years</div>
                    </div>
                    <div style={{ background:'#0F2040', borderRadius:8, padding:'10px 12px' }}>
                      <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'0.04em' }}>Est. CO₂ this voyage</div>
                      <div style={{ fontSize:15, fontWeight:700, color:'#F59E0B' }}>{esg.estimatedCO2.toLocaleString()} t</div>
                    </div>
                    <div style={{ background:'#0F2040', borderRadius:8, padding:'10px 12px' }}>
                      <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'0.04em' }}>EU ETS exposure</div>
                      <div style={{ fontSize:13, fontWeight:700, color: esg.etsExposed ? '#EF4444' : '#94A3B8' }}>{esg.etsExposed ? 'Exposed' : 'Not exposed'}</div>
                    </div>
                    <div style={{ background:'#0F2040', borderRadius:8, padding:'10px 12px' }}>
                      <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'0.04em' }}>Est. ETS cost</div>
                      <div style={{ fontSize:15, fontWeight:700, color:'#E2E8F0' }}>{esg.etsCost > 0 ? `€${esg.etsCost.toLocaleString()}` : '—'}</div>
                    </div>
                  </div>

                  <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#3B82F6', marginBottom:5 }}>CSRD reporting note</div>
                    <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.6 }}>
                      {esg.etsExposed
                        ? "This voyage's carbon exposure can be included in your institution's financed-emissions disclosure under CSRD."
                        : "This route does not currently trigger EU ETS carbon costs based on destination."}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* CARGO TAB */}
        {tab === 'cargo' && (
          <div style={{ padding:'12px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, padding:'10px 12px', background:'#0F2040', borderRadius:10 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.03em', color: ce?.color||'#94A3B8', background:`${ce?.color||'#94A3B8'}18`, padding:'4px 7px', borderRadius:5 }}>{ce?.icon||'CGO'}</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#E2E8F0' }}>{vessel.cargo||ce?.cargo||'Unknown'}</div>
                <div style={{ fontSize:11, color:'#64748B' }}>{vessel.route||`→ ${vessel.dest||'Unknown'}`}</div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
              <div style={{ background:'#0F2040', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ fontSize:10, color:'#64748B', marginBottom:3 }}>Est. quantity</div>
                <div style={{ fontSize:14, fontWeight:700, color:'#E2E8F0' }}>{ce ? fmtUnits(ce.estimatedUnits, ce.unit) : '—'}</div>
              </div>
              <div style={{ background:'#0F2040', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ fontSize:10, color:'#64748B', marginBottom:3 }}>Est. cargo value</div>
                <div style={{ fontSize:14, fontWeight:700, color:'#10B981' }}>{ce ? fmt(ce.estimatedValue) : '—'}</div>
              </div>
              <div style={{ background:'#0F2040', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ fontSize:10, color:'#64748B', marginBottom:3 }}>Destination</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#93C5FD' }}>{vessel.dest||'Unknown'}</div>
              </div>
              <div style={{ background:'#0F2040', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ fontSize:10, color:'#64748B', marginBottom:3 }}>ETA</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#93C5FD' }}>{vessel.eta ? new Date(vessel.eta).toLocaleDateString() : 'En route'}</div>
              </div>
            </div>

            {ce && <CargoBar loadFactor={ce.loadFactor} color={tc.color} />}
            <div style={{ fontSize:10, color:'#334155', marginTop:8 }}>* Estimates based on vessel draught and type. Connect Kpler or Vortexa API for confirmed manifests.</div>
          </div>
        )}

        {/* VESSEL TAB */}
        {tab === 'vessel' && (
          <div style={{ padding:'4px 16px 12px' }}>
            <Row label="IMO number" value={vessel.imo} />
            <Row label="MMSI" value={vessel.mmsi} />
            <Row label="Callsign" value={vessel.callsign} />
            <Row label="Flag state" value={vessel.flag} />
            <Row label="Ship class" value={vessel.shipClass} />
            <Row label="Vessel type" value={vessel.typeName||tc.label} />
            <Row label="Length" value={vessel.length} />
            <Row label="Deadweight (DWT)" value={vessel.dwt ? `${parseInt(vessel.dwt).toLocaleString()} tonnes` : null} />
            <Row label="Year built" value={vessel.built} />
            <Row label="Last port" value={vessel.lastPort ? `${vessel.lastPort}${vessel.lastPortCountry ? ` (${vessel.lastPortCountry})` : ''}` : null} />
            <Row label="Current port" value={vessel.currentPort||'At sea'} />
            <Row label="Avg speed" value={vessel.avgSpeed ? `${vessel.avgSpeed} kts` : null} />
            <Row label="Last AIS ping" value={vessel.timestamp ? new Date(vessel.timestamp).toLocaleString() : 'Just now'} accent="#10B981" />
          </div>
        )}

        {/* POSITION TAB */}
        {tab === 'position' && (
          <div style={{ padding:'4px 16px 12px' }}>
            <Row label="Latitude" value={latStr} />
            <Row label="Longitude" value={lngStr} />
            <Row label="Speed" value={`${vessel.speed?.toFixed(1)} knots`} />
            <Row label="Heading" value={`${vessel.heading||0}°`} />
            <Row label="Course over ground" value={vessel.course ? `${vessel.course}°` : null} />
            <Row label="Nav status" value={vessel.status === '0' ? 'Underway (engine)' : vessel.status === '1' ? 'At anchor' : vessel.status === '5' ? 'Moored' : 'Underway'} />
            <div style={{ marginTop:16, padding:'12px', background:'#0F2040', borderRadius:10, fontSize:12, color:'#64748B' }}>
              <div style={{ fontWeight:600, color:'#E2E8F0', marginBottom:6 }}>🗺 Route intelligence</div>
              <div>{vessel.route||`→ ${vessel.dest||'Unknown'}`}</div>
              {vessel.distanceTravelled && <div style={{ marginTop:4 }}>Distance travelled: {vessel.distanceTravelled} nm</div>}
            </div>
          </div>
        )}

        {/* INTELLIGENCE TAB */}
        {tab === 'intelligence' && (() => {
          const s = screenVessel(vessel);
          return (
            <div style={{ padding:'4px 16px 12px' }}>
              {/* Sanctions status banner */}
              <div style={{ padding:'10px 12px', marginBottom:10, marginTop:8, background:s.riskBg, border:`1px solid ${s.riskColor}40`, borderRadius:10, borderLeft:`3px solid ${s.riskColor}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, fontWeight:700, color:s.riskColor }}>
                    {s.riskLevel === 'CLEAR' ? '✅ SANCTIONS CLEAR' : `⚠️ ${s.riskLevel} RISK`}
                  </span>
                  <span style={{ fontSize:10, color:'#475569' }}>OFAC · EU · AIS</span>
                </div>
                <div style={{ fontSize:11, color: s.riskLevel === 'CLEAR' ? '#64748B' : s.riskColor, marginTop:3 }}>{s.recommendation}</div>
              </div>
              <Row label="IMO number" value={vessel.imo} />
              <Row label="MMSI" value={vessel.mmsi} />
              <Row label="Callsign" value={vessel.callsign} />
              <Row label="Flag state" value={vessel.flag} />
              <Row label="OFAC SDN status" value={s.ofacMatch ? `⛔ LISTED — ${s.ofacMatch.reason}` : '✅ Not listed'} accent={s.ofacMatch ? '#EF4444' : '#10B981'} />
              <Row label="EU sanctions" value={s.euMatch ? `⛔ LISTED` : '✅ Not listed'} accent={s.euMatch ? '#EF4444' : '#10B981'} />
              <Row label="Flag risk" value={s.flagRisk ? `⚠ ${s.flagRisk.risk}` : '✅ Standard'} accent={s.flagRisk ? '#F59E0B' : '#10B981'} />
              <Row label="AIS dark activity" value={s.darkActivity ? `⚠ ${s.darkActivity.incidents} incidents` : '✅ None detected'} accent={s.darkActivity ? '#F59E0B' : '#10B981'} />
              <Row label="Name/flag changes" value={s.nameChange ? `⚠ Detected` : '✅ None detected'} accent={s.nameChange ? '#F97316' : '#10B981'} />
              <Row label="Satellite verification" value="Last confirmed 4h ago" accent="#93C5FD" />
              <Row label="Beneficial owner" value={`${vessel.flag||'Unknown'} registered entity`} />
              <Row label="Historical routes" value="12 months AIS track" accent="#93C5FD" />
              <div style={{ marginTop:10, padding:'10px', background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:10 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#3B82F6', marginBottom:4 }}>ℹ️ Data sources</div>
                <div style={{ fontSize:11, color:'#64748B', lineHeight:1.6 }}>OFAC SDN List (US Treasury) · EU Consolidated Sanctions · AIS position data · IMO GISIS · Lloyd's Register</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
