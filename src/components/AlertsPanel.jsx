import React, { useState, useEffect } from 'react';
import { CHOKEPOINTS } from '../data/chokepoints';
import { VESSEL_TYPES } from '../data/vessels';

export default function AlertsPanel({ alerts, onClose, highlightChokepoint }) {
  const [tab, setTab] = useState('live');
  const [expandedZone, setExpandedZone] = useState(highlightChokepoint || null);

  useEffect(() => {
    if (highlightChokepoint) {
      setExpandedZone(highlightChokepoint);
      setTab('zones');
    }
  }, [highlightChokepoint]);

  const liveFeed = [...alerts].sort((a, b) => (b.time?.getTime?.()||0) - (a.time?.getTime?.()||0));

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#0B1829' }}>
      <div style={{ padding:'16px 18px 12px', borderBottom:'1px solid #1E3A5F', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#F0F6FF' }}>Chokepoint Alerts</div>
            <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>Vessel transit detection at strategic straits</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', fontSize:22, cursor:'pointer' }}>×</button>
        </div>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid #1E3A5F', flexShrink:0 }}>
        <button onClick={() => setTab('live')}
          style={{ flex:1, padding:'10px 0', background:'none', border:'none', borderBottom: tab==='live' ? '2px solid #DC2626' : '2px solid transparent', color: tab==='live' ? '#F0F6FF' : '#64748B', fontSize:13, fontWeight: tab==='live' ? 600 : 400, cursor:'pointer', marginBottom:-1, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          {tab==='live' && <span style={{ width:6, height:6, borderRadius:'50%', background:'#DC2626', display:'inline-block', animation:'fwpulse 1.6s infinite' }} />}
          Live Feed
        </button>
        <button onClick={() => setTab('zones')}
          style={{ flex:1, padding:'10px 0', background:'none', border:'none', borderBottom: tab==='zones' ? '2px solid #475569' : '2px solid transparent', color: tab==='zones' ? '#F0F6FF' : '#64748B', fontSize:13, fontWeight: tab==='zones' ? 600 : 400, cursor:'pointer', marginBottom:-1 }}>
          Monitored Zones
        </button>
      </div>

      <style>{`@keyframes fwpulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      <div style={{ flex:1, overflowY:'auto' }}>

        {tab === 'live' && (
          <div>
            {liveFeed.length === 0 && (
              <div style={{ padding:'40px 20px', textAlign:'center' }}>
                <div style={{ fontSize:12, color:'#334155' }}>No transits detected yet</div>
                <div style={{ fontSize:11, color:'#1E293B', marginTop:4 }}>All 8 chokepoints under active monitoring</div>
              </div>
            )}
            {liveFeed.map(a => <LiveFeedRow key={a.id} alert={a} />)}
          </div>
        )}

        {tab === 'zones' && (
          <div style={{ padding:'10px 12px' }}>
            <div style={{ fontSize:11, color:'#475569', marginBottom:10 }}>8 strategic chokepoints under continuous monitoring</div>
            {CHOKEPOINTS.map(cp => {
              const isExpanded = expandedZone === cp.id;
              const cpAlerts = alerts.filter(a => a.chokepoint?.id === cp.id);
              const hasLiveActivity = cpAlerts.length > 0;
              return (
                <div key={cp.id} style={{ marginBottom:6, borderRadius:8, border:`1px solid ${isExpanded ? cp.importanceColor+'70' : '#1E3A5F'}`, overflow:'hidden' }}>
                  <div onClick={() => setExpandedZone(isExpanded ? null : cp.id)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background: isExpanded ? `${cp.importanceColor}12` : 'transparent', cursor:'pointer' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background: hasLiveActivity ? '#DC2626' : '#334155', flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color: isExpanded ? cp.importanceColor : '#E2E8F0' }}>{cp.name}</div>
                      <div style={{ fontSize:11, color:'#475569' }}>{cp.dailyOil} · {cp.countries}</div>
                    </div>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, background:`${cp.importanceColor}20`, color:cp.importanceColor, fontWeight:700, letterSpacing:'0.02em' }}>{cp.importance}</span>
                    <div style={{ textAlign:'right', flexShrink:0, minWidth:42 }}>
                      <div style={{ fontSize:15, fontWeight:700, color: hasLiveActivity ? '#F59E0B' : '#475569' }}>{cpAlerts.length}</div>
                      <div style={{ fontSize:9, color:'#475569' }}>transits</div>
                    </div>
                    <span style={{ color:'#475569', fontSize:11, marginLeft:6 }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  {isExpanded && (
                    <div style={{ padding:'12px 14px', borderTop:`1px solid ${cp.importanceColor}30`, background:'rgba(0,0,0,0.15)' }}>
                      <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.6, marginBottom:10 }}>{cp.description}</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                        <div style={{ background:'#0F2040', borderRadius:6, padding:'8px 10px' }}>
                          <div style={{ fontSize:10, color:'#475569' }}>Daily throughput</div>
                          <div style={{ fontSize:13, fontWeight:600, color:'#E2E8F0' }}>{cp.dailyOil}</div>
                        </div>
                        <div style={{ background:'#0F2040', borderRadius:6, padding:'8px 10px' }}>
                          <div style={{ fontSize:10, color:'#475569' }}>Bordering states</div>
                          <div style={{ fontSize:12, fontWeight:600, color:'#E2E8F0' }}>{cp.countries}</div>
                        </div>
                        <div style={{ background:'#0F2040', borderRadius:6, padding:'8px 10px' }}>
                          <div style={{ fontSize:10, color:'#475569' }}>Status</div>
                          <div style={{ fontSize:12, fontWeight:600, color:'#10B981', display:'flex', alignItems:'center', gap:5 }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:'#10B981', display:'inline-block' }} />
                            Monitoring
                          </div>
                        </div>
                        <div style={{ background:'#0F2040', borderRadius:6, padding:'8px 10px' }}>
                          <div style={{ fontSize:10, color:'#475569' }}>Transits logged</div>
                          <div style={{ fontSize:13, fontWeight:600, color: hasLiveActivity ? '#DC2626' : '#E2E8F0' }}>{cpAlerts.length}</div>
                        </div>
                      </div>
                      {cpAlerts.length > 0 && (
                        <div>
                          <div style={{ fontSize:10, color:'#475569', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Recent transits</div>
                          {cpAlerts.slice(0,5).map(a => <ZoneTransitRow key={a.id} alert={a} />)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveFeedRow({ alert }) {
  const tc = VESSEL_TYPES[alert.type] || {};
  const cp = alert.chokepoint;
  return (
    <div style={{ display:'flex', gap:10, padding:'11px 16px', borderLeft:'3px solid #DC2626', borderBottom:'1px solid #0F2040' }}>
      <div style={{ width:7, height:7, borderRadius:'50%', background:'#DC2626', flexShrink:0, marginTop:5 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:13, fontWeight:600, color:'#F0F6FF' }}>{alert.vesselName}</span>
          <span style={{ fontSize:10, padding:'1px 6px', borderRadius:4, background:tc.bg||'#1E3A5F', color:tc.color||'#94A3B8', fontWeight:600 }}>{tc.label||alert.type}</span>
        </div>
        <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>
          Transiting <span style={{ color:'#E2E8F0', fontWeight:500 }}>{cp?.name}</span>
        </div>
        {alert.cargo && <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>{alert.cargo}{alert.cargoValue ? ` · Est. value ${alert.cargoValue}` : ''}</div>}
      </div>
      <div style={{ fontSize:10, color:'#475569', flexShrink:0, whiteSpace:'nowrap' }}>
        {alert.time?.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
      </div>
    </div>
  );
}

function ZoneTransitRow({ alert }) {
  const tc = VESSEL_TYPES[alert.type] || {};
  return (
    <div style={{ padding:'7px 0', borderBottom:'1px solid #0F2040' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:tc.color||'#94A3B8', flexShrink:0 }} />
        <span style={{ fontSize:12, fontWeight:500, color:'#E2E8F0' }}>{alert.vesselName}</span>
        <span style={{ fontSize:10, color:'#475569', marginLeft:'auto' }}>{alert.time?.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
      </div>
      {alert.cargoValue && <div style={{ fontSize:11, color:'#10B981', paddingLeft:12, marginTop:1 }}>Est. value: {alert.cargoValue}</div>}
    </div>
  );
}
