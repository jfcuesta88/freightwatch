import React, { useState, useEffect, useRef } from 'react';
import { FLOW_DATA, MONTHS } from '../data/commodityFlows';

function fmt(v) { return v >= 0 ? `▲ +${v.toFixed(1)}%` : `▼ ${v.toFixed(1)}%`; }

export default function CommodityFlows({ onClose }) {
  const [tab, setTab] = useState('crude');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const d = FLOW_DATA[tab];

  useEffect(() => {
    if (!chartRef.current) return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    script.onload = () => renderChart();
    if (window.Chart) { renderChart(); return; }
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (window.Chart) renderChart();
  }, [tab]);

  function renderChart() {
    if (!chartRef.current || !window.Chart) return;
    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new window.Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: MONTHS,
        datasets: [{
          data: FLOW_DATA[tab].trend,
          borderColor: FLOW_DATA[tab].color,
          backgroundColor: FLOW_DATA[tab].color + '20',
          borderWidth: 2,
          pointBackgroundColor: FLOW_DATA[tab].color,
          pointBorderColor: '#0a1628',
          pointBorderWidth: 2,
          pointRadius: 5,
          fill: true,
          tension: 0.3,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748B', font: { size: 11 } } },
          y: { grid: { color: '#1E3A5F' }, ticks: { color: '#64748B', font: { size: 11 } } }
        }
      }
    });
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#0B1829' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px 12px', borderBottom:'1px solid #1E3A5F', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#F0F6FF' }}>Commodity Flows</div>
            <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>Global trade routes · volume trends · market intelligence</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', fontSize:20, cursor:'pointer' }}>×</button>
        </div>

        {/* KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6, marginTop:12 }}>
          {Object.entries(FLOW_DATA).map(([key, fd]) => (
            <div key={key} onClick={() => setTab(key)} style={{ padding:'8px 6px', background: tab===key ? `${fd.color}15` : '#0F2040', borderRadius:8, border:`1px solid ${tab===key ? fd.color+'50' : '#1E3A5F'}`, cursor:'pointer', textAlign:'center' }}>
              <div style={{ fontSize:11, fontWeight:700, color: tab===key ? fd.color : '#94A3B8', marginBottom:2 }}>{fd.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color: tab===key ? fd.color : '#E2E8F0' }}>{fd.kpiValue}</div>
              <div style={{ fontSize:9, color:'#64748B' }}>{fd.kpiUnit}</div>
              <div style={{ fontSize:10, color: fd.delta>=0?'#10B981':'#EF4444', marginTop:1 }}>{fd.delta>=0?'▲':'▼'} {Math.abs(fd.delta).toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Commodity tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid #1E3A5F', flexShrink:0 }}>
        {Object.entries(FLOW_DATA).map(([key, fd]) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex:1, padding:'8px 0', background:'none', border:'none', borderBottom: tab===key ? `2px solid ${fd.color}` : '2px solid transparent', color: tab===key ? fd.color : '#64748B', fontSize:11, fontWeight: tab===key ? 600 : 400, cursor:'pointer', marginBottom:-1 }}>
            {fd.icon}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {/* Trade flow routes */}
        <div style={{ padding:'12px 14px', borderBottom:'1px solid #1E3A5F' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>
            {d.icon} {d.title} — top trade routes
          </div>
          {d.flows.map((f, i) => {
            const pct = Math.round((f.val / f.max) * 100);
            const up = f.delta >= 0;
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid #0F2040' }}>
                <div style={{ fontSize:11, fontWeight:500, color:'#E2E8F0', width:95, flexShrink:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.origin}</div>
                <div style={{ fontSize:11, color:'#334155' }}>→</div>
                <div style={{ fontSize:11, fontWeight:500, color:'#E2E8F0', width:85, flexShrink:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.dest}</div>
                <div style={{ flex:1, height:8, background:'#0F2040', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:d.color, borderRadius:4, transition:'width 0.5s' }} />
                </div>
                <div style={{ fontSize:11, color:'#94A3B8', width:55, textAlign:'right', flexShrink:0 }}>{f.val} {d.unit}</div>
                <div style={{ fontSize:10, color: up?'#10B981':'#EF4444', width:45, textAlign:'right', flexShrink:0, fontWeight:600 }}>{up?'▲':'▼'} {Math.abs(f.delta).toFixed(1)}%</div>
              </div>
            );
          })}
        </div>

        {/* Trend chart */}
        <div style={{ padding:'12px 14px', borderBottom:'1px solid #1E3A5F' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>
            6-month volume trend
          </div>
          <div style={{ position:'relative', height:130 }}>
            <canvas ref={chartRef} role="img" aria-label={`${d.title} 6-month trend chart`} />
          </div>
        </div>

        {/* Top importers */}
        <div style={{ padding:'12px 14px', borderBottom:'1px solid #1E3A5F' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>
            Top importers this month
          </div>
          {d.importers.map((im, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid #0F2040' }}>
              <div style={{ fontSize:12, fontWeight:500, color:'#E2E8F0', width:130, flexShrink:0 }}>{im.country}</div>
              <div style={{ flex:1, height:7, background:'#0F2040', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${im.share}%`, background:d.color, borderRadius:3, transition:'width 0.5s' }} />
              </div>
              <div style={{ fontSize:11, color:'#94A3B8', width:55, textAlign:'right', flexShrink:0 }}>{im.val} {d.unit}</div>
              <div style={{ fontSize:10, color:'#64748B', width:28, textAlign:'right', flexShrink:0 }}>{im.share}%</div>
            </div>
          ))}
        </div>

        {/* Market insight */}
        <div style={{ margin:'12px 14px 14px', padding:'12px 14px', background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#3B82F6', marginBottom:5 }}>Market intelligence</div>
          <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.6 }}>{d.insight}</div>
        </div>
      </div>
    </div>
  );
}
