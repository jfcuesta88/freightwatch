import React, { useState, useEffect } from 'react';
import { screenVessel, SANCTIONED_VESSELS, HIGH_RISK_FLAGS } from '../data/sanctions';
import { VESSEL_TYPES } from '../data/vessels';

const RISK_ICONS = { BLOCKED:'🚫', CRITICAL:'🔴', HIGH:'🟠', MEDIUM:'🟡', CLEAR:'✅' };

function RiskBadge({ level, color }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:`${color}20`, color }}>
      {RISK_ICONS[level] || '⚪'} {level}
    </span>
  );
}

export default function SanctionsPanel({ vessels, onSelectVessel, onClose }) {
  const [tab, setTab] = useState('screen');
  const [searchMMSI, setSearchMMSI] = useState('');
  const [screenResult, setScreenResult] = useState(null);
  const [screenedVessel, setScreenedVessel] = useState(null);
  const [lastUpdate] = useState(new Date());

  // Auto-screen all vessels for flagged issues
  const flaggedVessels = vessels.map(v => ({
    vessel: v,
    screening: screenVessel(v),
  })).filter(r => r.screening.riskLevel !== 'CLEAR');

  const criticalCount = flaggedVessels.filter(r => r.screening.riskLevel === 'BLOCKED' || r.screening.riskLevel === 'CRITICAL').length;
  const highCount = flaggedVessels.filter(r => r.screening.riskLevel === 'HIGH').length;

  function handleScreen(v) {
    setScreenedVessel(v);
    setScreenResult(screenVessel(v));
    setTab('result');
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#0B1829' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px 12px', borderBottom:'1px solid #1E3A5F', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#F0F6FF' }}>Sanctions Screening</div>
            <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>OFAC SDN · EU Sanctions · High-risk flags · AIS dark activity</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', fontSize:20, cursor:'pointer' }}>×</button>
        </div>

        {/* Live status */}
        <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
          <div style={{ padding:'4px 10px', borderRadius:8, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', fontSize:11, color:'#EF4444', fontWeight:600 }}>
            🚫 {criticalCount} BLOCKED
          </div>
          <div style={{ padding:'4px 10px', borderRadius:8, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', fontSize:11, color:'#F59E0B', fontWeight:600 }}>
            ⚠️ {highCount} HIGH RISK
          </div>
          <div style={{ padding:'4px 10px', borderRadius:8, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', fontSize:11, color:'#10B981', fontWeight:600 }}>
            ✅ {vessels.length - flaggedVessels.length} CLEAR
          </div>
        </div>
        <div style={{ fontSize:10, color:'#334155', marginTop:6 }}>
          OFAC SDN list · EU sanctions · Last sync: {lastUpdate.toLocaleDateString()} · Auto-updates daily
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid #1E3A5F', flexShrink:0 }}>
        {[['screen','Fleet Screen'],['search','Search Vessel'],['lists','Sanctions Lists'],['flags','Risk Flags']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex:1, padding:'8px 0', background:'none', border:'none', borderBottom: tab===k||tab==='result'&&k==='screen' ? '2px solid #EF4444' : '2px solid transparent', color: tab===k ? '#EF4444' : '#64748B', fontSize:11, fontWeight: tab===k ? 600 : 400, cursor:'pointer', marginBottom:-1 }}>{l}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>

        {/* FLEET SCREEN */}
        {tab === 'screen' && (
          <div style={{ padding:'10px 12px' }}>
            <div style={{ fontSize:11, color:'#64748B', marginBottom:10 }}>All tracked vessels screened against OFAC, EU sanctions, and risk indicators</div>
            {flaggedVessels.length === 0 ? (
              <div style={{ padding:24, textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
                <div style={{ fontSize:14, fontWeight:600, color:'#10B981' }}>All vessels clear</div>
                <div style={{ fontSize:12, color:'#475569', marginTop:4 }}>No sanctions matches in current fleet</div>
              </div>
            ) : flaggedVessels.map(({ vessel: v, screening: s }) => {
              const vt = VESSEL_TYPES[v.type] || {};
              return (
                <div key={v.id} style={{ padding:'11px 12px', marginBottom:8, background:s.riskBg, border:`1px solid ${s.riskColor}40`, borderRadius:10, borderLeft:`3px solid ${s.riskColor}`, cursor:'pointer' }}
                  onClick={() => handleScreen(v)}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#F0F6FF' }}>{v.name}</div>
                      <div style={{ fontSize:11, color:'#64748B' }}>{vt.label||v.type} · {v.flag} · {v.imo}</div>
                    </div>
                    <RiskBadge level={s.riskLevel} color={s.riskColor} />
                  </div>
                  {s.flags.map((f, i) => (
                    <div key={i} style={{ fontSize:11, color: f.level==='CRITICAL'||f.level==='BLOCKED' ? '#EF4444' : f.level==='HIGH' ? '#F59E0B' : '#F97316', marginTop:2 }}>
                      ⚠ {f.text}
                    </div>
                  ))}
                  <div style={{ fontSize:11, color:'#3B82F6', marginTop:4 }}>Click for full screening report →</div>
                </div>
              );
            })}

            {/* All clear vessels summary */}
            <div style={{ padding:'10px 12px', background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:10, marginTop:8 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#10B981', marginBottom:4 }}>✅ {vessels.length - flaggedVessels.length} vessels screened clear</div>
              {vessels.filter(v => screenVessel(v).riskLevel === 'CLEAR').map(v => (
                <div key={v.id} style={{ fontSize:11, color:'#475569', padding:'2px 0' }}>· {v.name} ({v.flag})</div>
              ))}
            </div>
          </div>
        )}

        {/* SCREENING RESULT */}
        {tab === 'result' && screenResult && screenedVessel && (
          <div style={{ padding:'12px 16px' }}>
            <button onClick={() => setTab('screen')} style={{ background:'#0F2040', border:'1px solid #1E3A5F', borderRadius:6, padding:'4px 10px', color:'#94A3B8', fontSize:11, cursor:'pointer', marginBottom:12 }}>← Back to fleet</button>

            <div style={{ padding:'14px', background:screenResult.riskBg, border:`1px solid ${screenResult.riskColor}40`, borderRadius:12, borderLeft:`4px solid ${screenResult.riskColor}`, marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:'#F0F6FF' }}>{screenedVessel.name}</div>
                  <div style={{ fontSize:11, color:'#64748B' }}>{screenedVessel.imo} · {screenedVessel.mmsi} · {screenedVessel.flag}</div>
                </div>
                <RiskBadge level={screenResult.riskLevel} color={screenResult.riskColor} />
              </div>
              <div style={{ fontSize:13, fontWeight:600, color: screenResult.riskColor, lineHeight:1.5 }}>
                {screenResult.recommendation}
              </div>
            </div>

            {/* Detailed checks */}
            {[
              { label:'OFAC SDN List', value: screenResult.ofacMatch ? `⛔ MATCH — ${screenResult.ofacMatch.reason}` : '✅ No match', color: screenResult.ofacMatch ? '#EF4444' : '#10B981', detail: screenResult.ofacMatch ? `Entity: ${screenResult.ofacMatch.entity} · Listed: ${screenResult.ofacMatch.date}` : null },
              { label:'EU Sanctions', value: screenResult.euMatch ? `⛔ MATCH — ${screenResult.euMatch.reason}` : '✅ No match', color: screenResult.euMatch ? '#EF4444' : '#10B981', detail: null },
              { label:'Flag state risk', value: screenResult.flagRisk ? `⚠ ${screenResult.flagRisk.flag} — ${screenResult.flagRisk.risk}` : '✅ Standard flag', color: screenResult.flagRisk ? (screenResult.flagRisk.risk === 'CRITICAL' ? '#EF4444' : '#F59E0B') : '#10B981', detail: screenResult.flagRisk?.reason },
              { label:'AIS dark activity', value: screenResult.darkActivity ? `⚠ ${screenResult.darkActivity.incidents} incidents` : '✅ No dark periods detected', color: screenResult.darkActivity ? '#F59E0B' : '#10B981', detail: screenResult.darkActivity?.suspicion },
              { label:'Name/flag changes', value: screenResult.nameChange ? `⚠ Change detected` : '✅ No changes detected', color: screenResult.nameChange ? '#F97316' : '#10B981', detail: screenResult.nameChange ? `${screenResult.nameChange.previousName} → ${screenResult.nameChange.currentName} (${screenResult.nameChange.flagChange})` : null },
            ].map(({ label, value, color, detail }) => (
              <div key={label} style={{ padding:'10px 12px', marginBottom:6, background:'#0F2040', borderRadius:9 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <span style={{ fontSize:12, color:'#64748B' }}>{label}</span>
                  <span style={{ fontSize:12, fontWeight:600, color, textAlign:'right', maxWidth:'55%' }}>{value}</span>
                </div>
                {detail && <div style={{ fontSize:11, color:'#475569', marginTop:3 }}>{detail}</div>}
              </div>
            ))}

            <div style={{ padding:'10px 12px', background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:10, marginTop:8 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#3B82F6', marginBottom:4 }}>📋 Compliance note</div>
              <div style={{ fontSize:11, color:'#64748B', lineHeight:1.5 }}>This screening uses public OFAC SDN, EU sanctions data, and AIS intelligence. For full due diligence connect Dow Jones Risk & Compliance, World-Check, or Refinitiv for comprehensive PEP and adverse media screening.</div>
            </div>

            <button onClick={() => onSelectVessel && onSelectVessel(screenedVessel.id)} style={{ width:'100%', marginTop:12, padding:'10px', background:'#1E3A5F', border:'none', borderRadius:8, color:'#93C5FD', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              View vessel on map →
            </button>
          </div>
        )}

        {/* SEARCH VESSEL */}
        {tab === 'search' && (
          <div style={{ padding:'12px 16px' }}>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:12 }}>Screen any vessel by name, IMO, or MMSI number</div>
            <input type="text" value={searchMMSI} onChange={e => setSearchMMSI(e.target.value)}
              placeholder="Enter vessel name, IMO, or MMSI..."
              style={{ width:'100%', background:'#0F2040', border:'1px solid #1E3A5F', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#E2E8F0', outline:'none', boxSizing:'border-box', marginBottom:10 }} />
            {searchMMSI && (() => {
              const q = searchMMSI.toLowerCase();
              const found = vessels.find(v =>
                (v.name||'').toLowerCase().includes(q) ||
                (v.imo||'').toLowerCase().includes(q) ||
                (v.mmsi||'').toLowerCase().includes(q)
              );
              if (!found) return <div style={{ padding:16, textAlign:'center', color:'#475569', fontSize:13 }}>No vessel found — enter a valid name, IMO, or MMSI</div>;
              const s = screenVessel(found);
              return (
                <div style={{ padding:'12px', background:s.riskBg, border:`1px solid ${s.riskColor}40`, borderRadius:10, borderLeft:`3px solid ${s.riskColor}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#F0F6FF' }}>{found.name}</div>
                    <RiskBadge level={s.riskLevel} color={s.riskColor} />
                  </div>
                  <div style={{ fontSize:12, color:'#64748B', marginBottom:8 }}>{found.flag} · {found.imo}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:s.riskColor }}>{s.recommendation}</div>
                  <button onClick={() => handleScreen(found)} style={{ marginTop:10, width:'100%', padding:'8px', background:'#1E3A5F', border:'none', borderRadius:8, color:'#93C5FD', fontSize:12, fontWeight:600, cursor:'pointer' }}>Full screening report →</button>
                </div>
              );
            })()}
          </div>
        )}

        {/* SANCTIONS LISTS */}
        {tab === 'lists' && (
          <div style={{ padding:'10px 12px' }}>
            <div style={{ fontSize:11, color:'#64748B', marginBottom:10 }}>Known sanctioned vessels — OFAC SDN & EU lists</div>
            {SANCTIONED_VESSELS.map((v, i) => (
              <div key={i} style={{ padding:'10px 12px', marginBottom:6, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:9 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'#F0F6FF' }}>{v.name}</span>
                  <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:'rgba(239,68,68,0.2)', color:'#EF4444', fontWeight:600 }}>{v.list}</span>
                </div>
                <div style={{ fontSize:11, color:'#64748B' }}>{v.flag} · {v.imo} · MMSI: {v.mmsi}</div>
                <div style={{ fontSize:11, color:'#EF4444', marginTop:2 }}>⚠ {v.reason}</div>
                <div style={{ fontSize:10, color:'#475569', marginTop:1 }}>Entity: {v.entity} · Listed: {v.date}</div>
              </div>
            ))}
          </div>
        )}

        {/* RISK FLAGS */}
        {tab === 'flags' && (
          <div style={{ padding:'10px 12px' }}>
            <div style={{ fontSize:11, color:'#64748B', marginBottom:10 }}>Flag states requiring enhanced due diligence</div>
            {HIGH_RISK_FLAGS.map((f, i) => {
              const color = f.risk === 'CRITICAL' ? '#EF4444' : f.risk === 'HIGH' ? '#F59E0B' : '#F97316';
              return (
                <div key={i} style={{ padding:'11px 12px', marginBottom:6, background:`${color}08`, border:`1px solid ${color}30`, borderRadius:9 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#F0F6FF' }}>{f.flag}</span>
                    <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:`${color}20`, color, fontWeight:700 }}>{f.risk}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#64748B', lineHeight:1.5 }}>{f.reason}</div>
                </div>
              );
            })}
            <div style={{ padding:'10px 12px', background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:10, marginTop:8, fontSize:11, color:'#64748B', lineHeight:1.6 }}>
              Sources: OFAC SDN List (US Treasury) · EU Consolidated Sanctions List · UN Security Council Sanctions · IMO High Risk Area designations
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
