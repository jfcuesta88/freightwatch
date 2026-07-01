import React from 'react';
import { VESSELS, VESSEL_TYPES } from '../data/vessels';

const GRADE_COLOR = { A:'#10B981', B:'#84CC16', C:'#F59E0B', D:'#F97316', E:'#EF4444' };

export default function ESGPanel({ onSelectVessel, onClose }) {
  const totalCO2 = VESSELS.reduce((s, v) => s + v.esg.estimatedCO2, 0);
  const totalETS = VESSELS.reduce((s, v) => s + v.esg.etsCost, 0);
  const etsExposedCount = VESSELS.filter(v => v.esg.etsExposed).length;
  const riskyCount = VESSELS.filter(v => v.esg.gradeIndex >= 3).length;

  const gradeCounts = { A:0, B:0, C:0, D:0, E:0 };
  VESSELS.forEach(v => gradeCounts[v.esg.ciiGrade]++);
  const maxGradeCount = Math.max(...Object.values(gradeCounts), 1);

  const sortedByRisk = [...VESSELS].sort((a, b) => b.esg.gradeIndex - a.esg.gradeIndex || b.esg.estimatedCO2 - a.esg.estimatedCO2);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#0B1829' }}>
      <div style={{ padding:'14px 16px 12px', borderBottom:'1px solid #1E3A5F', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#F0F6FF' }}>ESG &amp; Emissions</div>
            <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>Portfolio-wide carbon exposure across tracked fleet</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', fontSize:20, cursor:'pointer' }}>×</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginTop:12 }}>
          <div style={{ background:'#0F2040', borderRadius:8, padding:'10px 12px' }}>
            <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'0.04em' }}>Est. fleet CO₂</div>
            <div style={{ fontSize:18, fontWeight:700, color:'#F0F6FF' }}>{totalCO2.toLocaleString()} t</div>
          </div>
          <div style={{ background:'#0F2040', borderRadius:8, padding:'10px 12px' }}>
            <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'0.04em' }}>Est. EU ETS cost</div>
            <div style={{ fontSize:18, fontWeight:700, color:'#F59E0B' }}>€{totalETS.toLocaleString()}</div>
          </div>
          <div style={{ background:'#0F2040', borderRadius:8, padding:'10px 12px' }}>
            <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'0.04em' }}>EU ETS exposed</div>
            <div style={{ fontSize:18, fontWeight:700, color:'#E2E8F0' }}>{etsExposedCount} <span style={{ fontSize:11, color:'#64748B', fontWeight:400 }}>vessels</span></div>
          </div>
          <div style={{ background:'#0F2040', borderRadius:8, padding:'10px 12px' }}>
            <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'0.04em' }}>CII grade D/E</div>
            <div style={{ fontSize:18, fontWeight:700, color: riskyCount>0 ? '#EF4444' : '#E2E8F0' }}>{riskyCount} <span style={{ fontSize:11, color:'#64748B', fontWeight:400 }}>vessels</span></div>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>

        {/* CII distribution chart */}
        <div style={{ padding:'14px 16px', borderBottom:'1px solid #1E3A5F' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>
            CII grade distribution
          </div>
          {Object.entries(gradeCounts).map(([grade, count]) => (
            <div key={grade} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:7 }}>
              <div style={{ width:18, height:18, borderRadius:4, background:`${GRADE_COLOR[grade]}20`, color:GRADE_COLOR[grade], display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{grade}</div>
              <div style={{ flex:1, height:8, background:'#0F2040', borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(count/maxGradeCount)*100}%`, background:GRADE_COLOR[grade], borderRadius:4, transition:'width 0.5s' }} />
              </div>
              <div style={{ fontSize:12, color:'#94A3B8', width:18, textAlign:'right', flexShrink:0 }}>{count}</div>
            </div>
          ))}
          <div style={{ fontSize:10, color:'#475569', marginTop:8, lineHeight:1.5 }}>
            CII (Carbon Intensity Indicator) is an IMO-mandated efficiency rating from A (best) to E (worst), based on vessel age, type, and fuel consumption per cargo-mile.
          </div>
        </div>

        {/* Vessel list ranked by emissions risk */}
        <div style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>
            Highest emissions exposure
          </div>
          {sortedByRisk.slice(0, 10).map(v => {
            const tc = VESSEL_TYPES[v.type] || {};
            return (
              <div key={v.id} onClick={() => onSelectVessel(v.id)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid #0F2040', cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background='#0F2040'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ width:22, height:22, borderRadius:5, background:`${GRADE_COLOR[v.esg.ciiGrade]}20`, color:GRADE_COLOR[v.esg.ciiGrade], display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>{v.esg.ciiGrade}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#F0F6FF', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v.name}</div>
                  <div style={{ fontSize:11, color:'#64748B' }}>{tc.label} · Built {v.built} ({v.esg.age}y) · {v.esg.estimatedCO2.toLocaleString()} t CO₂</div>
                </div>
                {v.esg.etsExposed && (
                  <span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:'rgba(245,158,11,0.15)', color:'#F59E0B', fontWeight:700, flexShrink:0 }}>ETS</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Regulatory note */}
        <div style={{ margin:'0 16px 16px', padding:'12px 14px', background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#3B82F6', marginBottom:5 }}>CSRD reporting context</div>
          <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.6 }}>
            EU banks face mandatory financed-emissions disclosure under CSRD. Vessels calling at EU ports incur EU ETS carbon costs starting at 40% phase-in (2024) rising to 100% by 2026. This view aggregates exposure across all currently tracked vessels.
          </div>
        </div>
      </div>
    </div>
  );
}
