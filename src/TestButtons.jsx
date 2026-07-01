import React, { useState } from 'react';

export default function TestButtons() {
  const [active, setActive] = useState('');
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'#0a1628', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, zIndex:999999 }}>
      <div style={{ color:'white', fontSize:20 }}>Active: {active || 'none'}</div>
      <div style={{ display:'flex', gap:10 }}>
        {['Flows','Sanctions','Alerts','Markets','Ports'].map(name => (
          <button key={name} onClick={() => setActive(name)}
            style={{ padding:'10px 20px', background: active===name ? '#10B981' : '#1E3A5F', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:16, fontWeight:700 }}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
