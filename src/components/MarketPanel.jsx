import React, { useState, useEffect, useCallback } from 'react';

const COMMODITIES = [
  { id:'WTI',   name:'Crude Oil (WTI)',    unit:'per barrel', icon:'WTI', color:'#F59E0B', base:82.4  },
  { id:'BRENT', name:'Crude Oil (Brent)',  unit:'per barrel', icon:'BRT', color:'#EF4444', base:86.1  },
  { id:'NG',    name:'Natural Gas',        unit:'per MMBtu',  icon:'LNG', color:'#8B5CF6', base:2.84  },
  { id:'IO',    name:'Iron Ore',           unit:'per tonne',  icon:'IO',  color:'#6B7280', base:108.5 },
  { id:'COAL',  name:'Coal',               unit:'per tonne',  icon:'COL', color:'#374151', base:131.2 },
  { id:'WHEAT', name:'Wheat',              unit:'per bushel', icon:'WHT', color:'#D97706', base:548.0 },
  { id:'CORN',  name:'Corn',               unit:'per bushel', icon:'🌽', color:'#FBBF24', base:434.5 },
  { id:'SOY',   name:'Soybeans',           unit:'per bushel', icon:'🟡', color:'#92400E', base:1142.0},
  { id:'AL',    name:'Aluminum',           unit:'per tonne',  icon:'🔧', color:'#9CA3AF', base:2285.0},
  { id:'CU',    name:'Copper',             unit:'per lb',     icon:'🔶', color:'#B45309', base:4.28  },
];

const INDICES = [
  { id:'bdi',  name:'Baltic Dry Index',       desc:'Global bulk shipping cost',  color:'#3B82F6', base:1842 },
  { id:'bdti', name:'Dirty Tanker Index',     desc:'Crude oil tanker rates',     color:'#F59E0B', base:924  },
  { id:'bcti', name:'Clean Tanker Index',     desc:'Product tanker rates',       color:'#10B981', base:712  },
  { id:'scfi', name:'Container Freight Idx',  desc:'Shanghai container rates',   color:'#8B5CF6', base:2241 },
];

const GEO_EVENTS = [
  { id:1, time:'14:32', severity:'critical', title:'Houthi missile attack near Bab-el-Mandeb', desc:'3 vessels diverted around Cape of Good Hope. Red Sea transit risk elevated.', chokepoints:['Bab-el-Mandeb'], commodities:['WTI','BRENT'], impact:'+$3.2/bbl' },
  { id:2, time:'12:15', severity:'high',     title:'Iran naval exercises in Strait of Hormuz', desc:'IRGC conducting drills 40nm south of Bandar Abbas. Tanker traffic slowing.', chokepoints:['Hormuz'], commodities:['WTI','BRENT'], impact:'+$1.8/bbl' },
  { id:3, time:'10:48', severity:'medium',   title:'Panama Canal water levels at 5-year low', desc:'Draft restrictions tightened to 44ft. 38 vessels queuing. Transit times +8 days.', chokepoints:['Panama'], commodities:['CORN','WHEAT','SOY'], impact:'+$12/tonne' },
  { id:4, time:'09:20', severity:'medium',   title:'Rotterdam dock workers strike threat', desc:'Union negotiations stalled. 72hr strike notice filed. Container throughput risk.', chokepoints:[], commodities:['AL','CU'], impact:'Rate +15%' },
  { id:5, time:'08:05', severity:'low',      title:'China iron ore imports hit 6-month high', desc:'Qingdao port received 28 bulk carriers this week. Steel production ramping.', chokepoints:['Malacca'], commodities:['IO'], impact:'+$4.5/tonne' },
  { id:6, time:'07:30', severity:'low',      title:'US LNG exports at record — 14 bcf/day', desc:'Sabine Pass and Corpus Christi fully booked through Q2. European demand strong.', chokepoints:[], commodities:['NG'], impact:'-$0.12/MMBtu' },
];

const SEV = {
  critical:{ color:'#EF4444', label:'CRITICAL' },
  high:    { color:'#F59E0B', label:'HIGH'     },
  medium:  { color:'#3B82F6', label:'MEDIUM'   },
  low:     { color:'#10B981', label:'LOW'      },
};

async function fetchLivePrices() {
  try {
    // Use Yahoo Finance via allorigins proxy — completely free, no key needed
    const symbols = ['CL=F','BZ=F','NG=F','ZW=F','ZC=F','ZS=F','HG=F'];
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`;
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy, { signal: AbortSignal.timeout(5000) });
    const json = await res.json();
    const data = JSON.parse(json.contents);
    const quotes = data?.quoteResponse?.result || [];
    const prices = {};
    quotes.forEach(q => {
      const map = { 'CL=F':'WTI','BZ=F':'BRENT','NG=F':'NG','ZW=F':'WHEAT','ZC=F':'CORN','ZS=F':'SOY','HG=F':'CU' };
      const id = map[q.symbol];
      if (id) prices[id] = { price: q.regularMarketPrice, change: q.regularMarketChange, pct: q.regularMarketChangePercent };
    });
    return prices;
  } catch(e) {
    return null;
  }
}

function usePrices() {
  const [prices, setPrices] = useState(() => {
    const p = {};
    COMMODITIES.forEach(c => { p[c.id] = { price: c.base, change: (Math.random()-0.5)*2, pct: (Math.random()-0.5)*1 }; });
    return p;
  });
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const refresh = useCallback(async () => {
    const live = await fetchLivePrices();
    if (live && Object.keys(live).length > 0) {
      setPrices(prev => ({ ...prev, ...live }));
      setIsLive(true);
    } else {
      // Simulate drift for non-live commodities
      setPrices(prev => {
        const next = {};
        COMMODITIES.forEach(c => {
          const old = prev[c.id] || { price: c.base, change: 0, pct: 0 };
          const drift = (Math.random()-0.48) * old.price * 0.002;
          next[c.id] = { price: Math.max(old.price + drift, 0.1), change: old.change + drift, pct: ((old.change + drift)/c.base)*100 };
        });
        return next;
      });
    }
    setLastUpdate(new Date());
  }, []);

  useEffect(() => { refresh(); const i = setInterval(refresh, 30000); return () => clearInterval(i); }, [refresh]);

  const [indices, setIndices] = useState(() => {
    const p = {};
    INDICES.forEach(i => { p[i.id] = { value: i.base + (Math.random()-0.5)*50, change: (Math.random()-0.5)*30 }; });
    return p;
  });
  useEffect(() => {
    const i = setInterval(() => {
      setIndices(prev => {
        const next = {};
        INDICES.forEach(idx => {
          const old = prev[idx.id] || { value: idx.base, change: 0 };
          const drift = (Math.random()-0.48) * idx.base * 0.003;
          next[idx.id] = { value: Math.max(old.value + drift, 100), change: old.change + drift };
        });
        return next;
      });
    }, 8000);
    return () => clearInterval(i);
  }, []);

  return { prices, indices, isLive, lastUpdate };
}

export default function MarketPanel({ onClose }) {
  const [tab, setTab] = useState('commodities');
  const { prices, indices, isLive, lastUpdate } = usePrices();

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#0B1829' }}>
      <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid #1E3A5F', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#F0F6FF' }}>Market Intelligence</div>
            <div style={{ fontSize:11, color: isLive ? '#10B981' : '#64748B', marginTop:1 }}>
              <span style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background: isLive ? '#10B981' : '#475569', marginRight:4, verticalAlign:'middle' }}></span>
              {isLive ? 'Live market data' : 'Simulated'} · {lastUpdate.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', fontSize:20, cursor:'pointer' }}>×</button>
        </div>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid #1E3A5F', flexShrink:0 }}>
        {[['commodities','Prices'],['indices','Freight Rates'],['events','Geo Events']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex:1, padding:'8px 0', background:'none', border:'none', borderBottom: tab===k ? '2px solid #10B981' : '2px solid transparent', color: tab===k ? '#10B981' : '#64748B', fontSize:12, fontWeight: tab===k ? 600 : 400, cursor:'pointer', marginBottom:-1 }}>{l}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {tab === 'commodities' && (
          <div style={{ padding:'10px 12px' }}>
            {COMMODITIES.map(c => {
              const p = prices[c.id];
              if (!p) return null;
              const up = p.change >= 0;
              return (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', marginBottom:5, background:'#0F2040', borderRadius:8 }}>
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.03em', color:c.color, background:`${c.color}18`, padding:'2px 5px', borderRadius:4 }}>{c.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:'#E2E8F0' }}>{c.name}</div>
                    <div style={{ fontSize:10, color:'#64748B' }}>{c.unit}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#F0F6FF' }}>${p.price.toFixed(c.id==='CU'?2:1)}</div>
                    <div style={{ fontSize:10, color: up?'#10B981':'#EF4444', fontWeight:600 }}>{up?'▲':'▼'} {Math.abs(p.pct||0).toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize:10, color:'#334155', padding:'6px 4px' }}>
              {isLive ? '✅ Live via Yahoo Finance · refreshes every 30s' : 'Simulated prices · connect Yahoo Finance for live data'}
            </div>
          </div>
        )}

        {tab === 'indices' && (
          <div style={{ padding:'10px 12px' }}>
            <div style={{ fontSize:11, color:'#475569', marginBottom:8 }}>Shipping rate indices · Higher = more expensive to ship</div>
            {INDICES.map(idx => {
              const d = indices[idx.id];
              if (!d) return null;
              const up = d.change >= 0;
              return (
                <div key={idx.id} style={{ padding:'11px 12px', marginBottom:8, background:'#0F2040', borderRadius:10, border:`1px solid ${idx.color}30` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#E2E8F0' }}>{idx.name}</div>
                      <div style={{ fontSize:10, color:'#64748B' }}>{idx.desc}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:17, fontWeight:700, color:idx.color }}>{Math.round(d.value).toLocaleString()}</div>
                      <div style={{ fontSize:10, color: up?'#10B981':'#EF4444', fontWeight:600 }}>{up?'▲':'▼'} {Math.abs((d.change/idx.base)*100).toFixed(2)}%</div>
                    </div>
                  </div>
                  <div style={{ height:4, background:'#0a1628', borderRadius:2 }}>
                    <div style={{ height:'100%', width:`${Math.min((d.value/idx.base)*50,100)}%`, background:idx.color, borderRadius:2, transition:'width 1s' }} />
                  </div>
                </div>
              );
            })}
            <div style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:10, padding:'10px 12px', marginTop:4 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#3B82F6', marginBottom:4 }}>What this means</div>
              <div style={{ fontSize:11, color:'#64748B', lineHeight:1.6 }}>Baltic Dry up 20% → commodity prices follow in 2–4 weeks. Dirty Tanker spike → retail fuel prices rise 6–8 weeks later.</div>
            </div>
          </div>
        )}

        {tab === 'events' && (
          <div style={{ padding:'8px 12px' }}>
            <div style={{ fontSize:11, color:'#475569', marginBottom:8 }}>Geopolitical events affecting freight</div>
            {GEO_EVENTS.map(ev => {
              const sev = SEV[ev.severity];
              return (
                <div key={ev.id} style={{ padding:'11px 12px', marginBottom:8, background:`${sev.color}10`, border:`1px solid ${sev.color}30`, borderRadius:10, borderLeft:`3px solid ${sev.color}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
                    <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:`${sev.color}25`, color:sev.color, fontWeight:700 }}>{sev.label}</span>
                    <span style={{ fontSize:10, color:'#475569' }}>{ev.time} UTC</span>
                    {ev.impact && <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color:'#10B981' }}>{ev.impact}</span>}
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#E2E8F0', marginBottom:3 }}>{ev.title}</div>
                  <div style={{ fontSize:11, color:'#94A3B8', lineHeight:1.5, marginBottom:6 }}>{ev.desc}</div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {ev.chokepoints.map(cp => <span key={cp} style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:'rgba(239,68,68,0.15)', color:'#EF4444' }}>{cp}</span>)}
                    {ev.commodities.map(cid => {
                      const c = COMMODITIES.find(x => x.id===cid);
                      const p = prices[cid];
                      return c ? <span key={cid} style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:'rgba(245,158,11,0.15)', color:'#F59E0B' }}>{c.id} {p?`$${p.price.toFixed(1)}`:''}</span> : null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
