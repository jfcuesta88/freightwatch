import React from 'react';
import { VESSEL_TYPES } from '../data/vessels';

export default function StatsBar({ counts }) {
  const types = ['vlcc','tanker','lng','lpg','bulk','container','chemical'];
  return (
    <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6, zIndex:10, background:'rgba(11,24,41,0.93)', border:'1px solid #1E3A5F', borderRadius:10, padding:'7px 12px', alignItems:'center' }}>
      <div style={{ paddingRight:10, borderRight:'1px solid #1E3A5F', marginRight:4 }}>
        <div style={{ fontSize:16, fontWeight:700, color:'#F0F6FF' }}>{counts.all}</div>
        <div style={{ fontSize:9, color:'#475569' }}>vessels</div>
      </div>
      {types.map(t => {
        const tc = VESSEL_TYPES[t];
        return counts[t] > 0 ? (
          <div key={t} style={{ textAlign:'center', padding:'0 5px' }}>
            <div style={{ fontSize:14, fontWeight:700, color:tc.color }}>{counts[t]}</div>
            <div style={{ fontSize:9, color:'#475569' }}>{tc.label.split(' ')[0]}</div>
          </div>
        ) : null;
      })}
    </div>
  );
}
