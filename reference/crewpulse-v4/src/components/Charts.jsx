import React, { useId, useMemo, useState } from 'react';

const nice = (n) => Math.round(n * 10) / 10;

/** Area/line chart. series: [{name, color, data}] */
export function LineChart({ series, labels, height = 220, yMin = 0, yMax = 100, yTicks = [0, 25, 50, 75, 100], light = false, unit = '%', area = true, band }) {
  const id = useId().replace(/:/g, '');
  const [hover, setHover] = useState(null);
  const W = 800;
  const H = height;
  const pad = { l: 44, r: 28, t: 14, b: 30 };
  const n = labels.length;
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(n - 1, 1);
  const y = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  const grid = light ? '#dfe5f5' : 'rgba(120,150,230,.14)';
  const txt = light ? '#7a869f' : '#8ea0cc';
  const step = n > 14 ? Math.ceil(n / 7) : 1;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" onMouseLeave={() => setHover(null)}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`g${id}${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.fill || s.color} stopOpacity={light ? 0.55 : 0.35} />
              <stop offset="100%" stopColor={s.fill || s.color} stopOpacity={light ? 0.04 : 0} />
            </linearGradient>
          ))}
        </defs>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={grid} strokeWidth="1" />
            <text x={pad.l - 10} y={y(t) + 4} textAnchor="end" fontSize="12" fill={txt}>
              {t}
              {unit}
            </text>
          </g>
        ))}
        {band && (
          <path
            d={`M${band.hi.map((v, i) => `${x(i)},${y(v)}`).join('L')}L${band.lo.map((v, i) => `${x(n - 1 - i)},${y(band.lo[n - 1 - i])}`).join('L')}Z`}
            fill={series[0].color}
            opacity=".16"
          />
        )}
        {labels.map((l, i) =>
          i % step === 0 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fill={txt}>
              {l}
            </text>
          ) : null
        )}
        {series.map((s, si) => {
          const pts = s.data.map((v, i) => `${x(i)},${y(v)}`);
          return (
            <g key={si}>
              {area && <path d={`M${x(0)},${y(yMin)}L${pts.join('L')}L${x(n - 1)},${y(yMin)}Z`} fill={`url(#g${id}${si})`} />}
              <polyline points={pts.join(' ')} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeDasharray={s.dash} className="draw" />
              {n <= 14 && s.data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.2" fill={light ? '#0b1a44' : s.color} />)}
            </g>
          );
        })}
        {labels.map((_, i) => (
          <rect key={i} x={x(i) - (W - pad.l - pad.r) / (2 * Math.max(n - 1, 1))} y={pad.t} width={(W - pad.l - pad.r) / Math.max(n - 1, 1)} height={H - pad.t - pad.b} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
        {hover != null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke={txt} strokeDasharray="3 4" opacity=".6" />
            {series.map((s, si) => (
              <circle key={si} cx={x(hover)} cy={y(s.data[hover])} r="5" fill={s.color} stroke="#fff" strokeWidth="1.5" />
            ))}
          </g>
        )}
      </svg>
      {hover != null && (
        <div className={`chart-tip ${light ? 'light' : ''}`} style={{ left: `${(x(hover) / W) * 100}%` }}>
          <b>{labels[hover]}</b>
          {series.map((s, si) => (
            <div key={si}>
              <i style={{ background: s.color }} /> {s.name ? `${s.name}: ` : ''}
              {nice(s.data[hover])}
              {unit === '%' ? '%' : unit}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sparkline({ data, color = '#6ee3a3', height = 36, width = 120, fill = true }) {
  const id = useId().replace(/:/g, '');
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => [(i * width) / (data.length - 1), height - 3 - ((v - min) / (max - min || 1)) * (height - 6)]);
  const d = pts.map((p) => p.join(',')).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={`M0,${height}L${d.replace(/ /g, 'L')}L${width},${height}Z`} fill={`url(#s${id})`} />}
      <polyline points={d} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** Ring made of arc segments: parts: [{value,color,label}] */
export function Donut({ parts, size = 110, thickness = 18, gap = 5, spin = true }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = parts.reduce((a, p) => a + p.value, 0);
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={spin ? 'donut-spin' : ''}>
      <circle cx={size / 2} cy={size / 2} r={r + thickness / 2 + 2} fill="rgba(10,19,48,.8)" stroke="rgba(77,124,242,.35)" />
      {parts.map((p, i) => {
        const len = (p.value / total) * c - gap;
        const off = -acc * (c / total) - gap / 2;
        acc += p.value;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={p.color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${Math.max(len, 1)} ${c}`}
            strokeDashoffset={off}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
      })}
    </svg>
  );
}

export function Gauge({ value, label, color = '#6ee3a3', size = 140 }) {
  const r = size / 2 - 12;
  const c = Math.PI * r;
  return (
    <div className="gauge" style={{ width: size }}>
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        <path d={`M12 ${size / 2} A${r} ${r} 0 0 1 ${size - 12} ${size / 2}`} fill="none" stroke="rgba(120,150,230,.18)" strokeWidth="10" strokeLinecap="round" />
        <path d={`M12 ${size / 2} A${r} ${r} 0 0 1 ${size - 12} ${size / 2}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} style={{ transition: 'stroke-dasharray .6s' }} />
      </svg>
      <div className="gauge-val" style={{ color }}>
        {Math.round(value)}
        <small>{label}</small>
      </div>
    </div>
  );
}

export function HBars({ items, max = 100, unit = '' }) {
  return (
    <div className="hbars">
      {items.map((it) => (
        <div className="hbar" key={it.label}>
          <div className="hbar-top">
            <span>{it.label}</span>
            <b style={{ color: it.color }}>
              {it.value > 0 && it.signed ? '+' : ''}
              {it.value}
              {unit}
            </b>
          </div>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: `${Math.min(100, (Math.abs(it.value) / max) * 100)}%`, background: it.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StackedBars({ data, keys, colors, labels, height = 200 }) {
  const max = Math.max(...data.map((d) => keys.reduce((a, k) => a + d[k], 0)));
  return (
    <div className="stack" style={{ height }}>
      {data.map((d, i) => (
        <div className="stack-col" key={i}>
          <div className="stack-bar" style={{ height: '100%' }}>
            {keys.map((k, ki) => (
              <div key={k} title={`${k}: ${d[k]}h`} style={{ height: `${(d[k] / max) * 100}%`, background: colors[ki] }} />
            ))}
          </div>
          <span>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function Heat({ rows, cols, values, onPick }) {
  const colorFor = (v) => ['#16315f', '#1f5a86', '#c9a227', '#f97316', '#ef4444'][v];
  const names = ['Minimal', 'Low', 'Watch', 'Elevated', 'High'];
  return (
    <div className="heat" style={{ gridTemplateColumns: `150px repeat(${cols.length}, 1fr)` }}>
      <div />
      {cols.map((c) => (
        <div className="heat-h" key={c}>{c}</div>
      ))}
      {rows.map((r, ri) => (
        <React.Fragment key={r}>
          <div className="heat-r">{r}</div>
          {cols.map((c, ci) => (
            <button key={c} className="heat-c" style={{ background: colorFor(values[ri][ci]) }} onClick={() => onPick && onPick(r, c, values[ri][ci])} title={`${r} · ${c}: ${names[values[ri][ci]]}`}>
              {names[values[ri][ci]]}
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

export const statusColor = (s) => (s === 'Nominal' ? '#6ee3a3' : s === 'Monitor' ? '#f59e0b' : s === 'Elevate' ? '#f97316' : '#ef4444');

export function useSeries(len, base, jitter, seed = 1) {
  return useMemo(() => {
    let s = seed * 9301;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: len }, () => base + (rnd() - 0.5) * jitter);
  }, [len, base, jitter, seed]);
}
