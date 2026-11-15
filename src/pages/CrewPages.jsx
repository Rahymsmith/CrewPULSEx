import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '../router.jsx';
import Icon from '../components/Icon.jsx';
import { Card, CrewPicker, PageHead, Pill, Btn, useCrew, Toggle } from '../components/UI.jsx';
import { Gauge, HBars, LineChart, Sparkline, StackedBars, statusColor } from '../components/Charts.jsx';
import { Tilt } from '../components/Visuals.jsx';
import { CREW } from '../data.js';
import { download, useStore } from '../store.jsx';

/* deterministic pseudo random so charts are stable per crew member */
const rng = (seed) => {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};
const seedOf = (c) => parseInt(c.id.slice(-1), 10) * 7 + 3;
const series = (c, len, base, jitter, drift = 0) => {
  const r = rng(seedOf(c) + len + Math.round(base));
  return Array.from({ length: len }, (_, i) => Math.max(0, base + (r() - 0.5) * jitter + drift * (i / (len - 1))));
};

/* ---------------------------------------------------------------- PROFILE */
export function Profile() {
  const [crew, setCrew] = useCrew();
  const { notify } = useStore();
  const nav = useNavigate();
  const [notes, setNotes] = useState({});
  const [draft, setDraft] = useState('');
  const hist = useMemo(() => series(crew, 30, crew.readiness - 4, 14, crew.status === 'Nominal' ? 4 : -10).map((v) => Math.min(100, v)), [crew]);
  const labels = hist.map((_, i) => `D${113 + i}`);
  const band = { hi: hist.map(() => crew.readiness + 8), lo: hist.map(() => crew.readiness - 12) };
  const rows = [
    { k: 'Resting heart rate', cur: crew.hr, base: crew.baseHr, u: 'bpm', bad: crew.hr > crew.baseHr + 5 },
    { k: 'Heart-rate variability', cur: crew.hrv, base: crew.baseHrv, u: 'ms', bad: crew.hrv < crew.baseHrv - 10 },
    { k: 'Sleep duration', cur: crew.sleep, base: crew.baseSleep, u: 'h', bad: crew.sleep < crew.baseSleep - 1 },
    { k: 'Blood oxygen (SpO₂)', cur: crew.spo2, base: 98, u: '%', bad: crew.spo2 < 96 },
    { k: 'Perceived stress', cur: crew.stress, base: 25, u: '/100', bad: crew.stress > 55 },
  ];
  const mine = notes[crew.id] || [
    { t: 'Day 140', x: 'Baseline recalibrated after EVA prep block.' },
    { t: 'Day 128', x: 'Routine medical check-in completed — no concerns.' },
    { t: 'Day 101', x: 'Team debrief attended; mood stable.' },
  ];
  const add = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setNotes({ ...notes, [crew.id]: [{ t: 'Day 142', x: draft.trim() }, ...mine] });
    setDraft('');
    notify('Note added to crew history');
  };

  return (
    <>
      <PageHead
        eyebrow="CREW HEALTH"
        title="Crew member profile"
        desc="Individual history and personal baseline. Every alert is judged against the person, not a population average."
        right={<Btn variant="outline" icon="download" onClick={() => { download(`${crew.id}-profile.json`, JSON.stringify(crew, null, 2), 'application/json'); notify('Profile exported'); }}>Export profile</Btn>}
      />
      <CrewPicker value={crew.id} onChange={setCrew} />
      <div className="grid g-profile">
        <Tilt className="id-card" max={7}>
          <div className="id-avatar" style={{ '--c': statusColor(crew.status) }}>
            {crew.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <h2>{crew.name}</h2>
          <p>{crew.role} · {crew.id}</p>
          <Pill status={crew.status} />
          <div className="id-stats">
            <div><b>{crew.age}</b><span>Age</span></div>
            <div><b>{crew.readiness}%</b><span>Readiness</span></div>
            <div><b>142</b><span>Mission day</span></div>
          </div>
          <div className="row gap">
            <Btn variant="blue" onClick={() => nav('/app/vitals')}>Live vitals</Btn>
            <Btn variant="outline" onClick={() => nav('/app/prediction')}>Risk forecast</Btn>
          </div>
        </Tilt>
        <Card title="Readiness history" sub="30-day composite vs. personal expected range">
          <LineChart series={[{ name: 'Readiness', color: '#5178dd', data: hist }]} band={band} labels={labels} height={240} />
        </Card>
      </div>
      <div className="grid g2">
        <Card title="Baseline vs. current" sub="Personal baseline established from days 1–30">
          <table className="tbl">
            <thead><tr><th>Metric</th><th>Baseline</th><th>Current</th><th>Δ</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const d = Math.round((r.cur - r.base) * 10) / 10;
                return (
                  <tr key={r.k}>
                    <td>{r.k}</td>
                    <td>{r.base} {r.u}</td>
                    <td><b>{r.cur}</b> {r.u}</td>
                    <td style={{ color: r.bad ? '#f97316' : '#6ee3a3', fontWeight: 700 }}>{d > 0 ? '+' : ''}{d}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <Card title="History & notes" sub="Visible to flight surgeon and mission control">
          <form className="note-form" onSubmit={add}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a note to this crew member's history…" />
            <Btn variant="green">Add</Btn>
          </form>
          <ul className="timeline-list">
            {mine.map((n, i) => (
              <li key={i}><span>{n.t}</span><p>{n.x}</p></li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- VITALS */
function Ecg({ bpm, running }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = c.offsetWidth;
    const h = 150;
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    let x = 0;
    let raf;
    let phase = 0;
    const buf = new Array(Math.floor(w)).fill(h / 2);
    const beat = (p) => {
      if (p < 0.08) return -Math.sin((p / 0.08) * Math.PI) * 8;
      if (p > 0.16 && p < 0.2) return ((p - 0.16) / 0.04) * 10;
      if (p >= 0.2 && p < 0.24) return 10 - ((p - 0.2) / 0.04) * 62;
      if (p >= 0.24 && p < 0.28) return -52 + ((p - 0.24) / 0.04) * 66;
      if (p >= 0.28 && p < 0.31) return 14 - ((p - 0.28) / 0.03) * 14;
      if (p > 0.45 && p < 0.58) return -Math.sin(((p - 0.45) / 0.13) * Math.PI) * 14;
      return 0;
    };
    const draw = () => {
      if (running) {
        const period = (60 / bpm) * 60; // frames
        for (let k = 0; k < 2; k++) {
          phase = (phase + 1 / period) % 1;
          buf.push(h / 2 + beat(phase));
          buf.shift();
        }
      }
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(120,150,230,.12)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 30) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
      for (let gy = 0; gy < h; gy += 30) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
      ctx.strokeStyle = '#6ee3a3';
      ctx.shadowColor = '#6ee3a3';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      buf.forEach((v, i) => (i ? ctx.lineTo(i, v) : ctx.moveTo(i, v)));
      ctx.stroke();
      ctx.shadowBlur = 0;
      x += 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [bpm, running]);
  return <canvas ref={ref} className="ecg" style={{ width: '100%', height: 150 }} />;
}

export function Vitals() {
  const [crew, setCrew] = useCrew();
  const { thresholds } = useStore();
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const hist = useRef({});

  useEffect(() => {
    if (!running) return undefined;
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [running]);

  const metric = (key, base, jit) => {
    const k = crew.id + key;
    if (!hist.current[k]) hist.current[k] = Array.from({ length: 30 }, (_, i) => base + Math.sin(i / 3 + seedOf(crew)) * jit * 0.5);
    return hist.current[k];
  };
  const defs = [
    { key: 'hr', label: 'Heart rate', unit: 'bpm', base: crew.hr, jit: 3, icon: 'heart', warn: (v) => v > crew.baseHr + 12 },
    { key: 'hrv', label: 'HRV', unit: 'ms', base: crew.hrv, jit: 4, icon: 'zap', warn: (v) => v < thresholds.hrv },
    { key: 'spo2', label: 'SpO₂', unit: '%', base: crew.spo2, jit: 0.8, icon: 'drop', warn: (v) => v < 95 },
    { key: 'temp', label: 'Skin temp', unit: '°C', base: crew.temp, jit: 0.15, icon: 'thermo', warn: (v) => v > 37.4 },
    { key: 'resp', label: 'Respiration', unit: '/min', base: crew.resp, jit: 1.2, icon: 'lung', warn: (v) => v > 20 },
    { key: 'stress', label: 'Stress index', unit: '/100', base: crew.stress, jit: 6, icon: 'brain', warn: (v) => v > thresholds.stress },
  ];
  // advance the buffers
  const live = defs.map((d) => {
    const buf = metric(d.key, d.base, d.jit);
    if (running && tick >= 0) {
      const last = buf[buf.length - 1];
      const next = d.base + (last - d.base) * 0.6 + (Math.random() - 0.5) * d.jit;
      if (buf.lastTick !== tick) { buf.push(next); buf.shift(); buf.lastTick = tick; }
    }
    return { ...d, buf, val: buf[buf.length - 1] };
  });
  const fmt = (d, v) => (d.key === 'temp' ? v.toFixed(1) : d.key === 'spo2' ? v.toFixed(1) : Math.round(v));

  return (
    <>
      <PageHead
        eyebrow="CREW HEALTH"
        title="Vital monitor"
        desc="Live biometric stream from wearable sensors. Values turn amber when they cross your configured thresholds."
        right={
          <Btn variant={running ? 'outline' : 'green'} icon={running ? 'pause' : 'play'} onClick={() => setRunning(!running)}>
            {running ? 'Pause stream' : 'Resume stream'}
          </Btn>
        }
      />
      <CrewPicker value={crew.id} onChange={setCrew} />
      <Card title={`${crew.name} — ECG`} sub={`Simulated lead II · ${Math.round(live[0].val)} bpm`} right={<span className="live"><i /> {running ? 'LIVE' : 'PAUSED'}</span>}>
        <Ecg bpm={Math.max(40, live[0].val)} running={running} />
      </Card>
      <div className="vital-grid">
        {live.map((d) => {
          const bad = d.warn(d.val);
          return (
            <Tilt key={d.key} className={`vital ${bad ? 'bad' : ''}`} max={9}>
              <div className="vital-top"><span><Icon name={d.icon} size={15} /> {d.label}</span><span className={`dot ${bad ? 'warn' : 'ok'}`} /></div>
              <b>{fmt(d, d.val)}<small> {d.unit}</small></b>
              <Sparkline data={d.buf} color={bad ? '#f59e0b' : '#6ee3a3'} height={42} />
            </Tilt>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------- BEHAVIORAL */
export function Behavioral() {
  const [crew, setCrew] = useCrew();
  const { notify } = useStore();
  const [mood, setMood] = useState(7);
  const [load, setLoad] = useState(6);
  const [logs, setLogs] = useState([]);
  const days = Array.from({ length: 14 }, (_, i) => `D${129 + i}`);
  const moodS = useMemo(() => series(crew, 14, crew.mood, 8, crew.status === 'Nominal' ? 2 : -14), [crew]);
  const loadS = useMemo(() => series(crew, 14, crew.load - 10, 10, 10), [crew]);
  const coh = useMemo(() => series(crew, 14, 78, 6, crew.status === 'Nominal' ? 0 : -9), [crew]);
  const cohesion = Math.round(coh[coh.length - 1]);

  const submit = (e) => {
    e.preventDefault();
    setLogs([{ t: new Date().toUTCString().slice(17, 22) + ' UTC', mood, load }, ...logs].slice(0, 5));
    notify('Daily check-in recorded');
  };

  return (
    <>
      <PageHead eyebrow="CREW HEALTH" title="Behavioural health" desc="Mood, team cohesion and workload trends — early signals of adverse behavioral conditions on long-duration missions." />
      <CrewPicker value={crew.id} onChange={setCrew} />
      <div className="grid g-3-1">
        <Card title="14-day trends" sub={`${crew.name} · mood, cohesion & workload`}>
          <div className="legend row-legend">
            <span><i style={{ background: '#6ee3a3' }} /> Mood</span>
            <span><i style={{ background: '#5178dd' }} /> Team cohesion</span>
            <span><i style={{ background: '#f97316' }} /> Workload</span>
          </div>
          <LineChart area={false} height={250} labels={days} series={[{ name: 'Mood', color: '#6ee3a3', data: moodS }, { name: 'Cohesion', color: '#5178dd', data: coh }, { name: 'Workload', color: '#f97316', data: loadS }]} />
        </Card>
        <Card title="Team cohesion">
          <div className="center"><Gauge value={cohesion} label="index" color={cohesion > 70 ? '#6ee3a3' : '#f59e0b'} size={190} /></div>
          <p className="muted small center-t">{cohesion > 70 ? 'Interaction frequency within normal range.' : 'Interaction frequency is below team baseline.'}</p>
        </Card>
      </div>
      <div className="grid g2">
        <Card title="Mood by crew member" sub="Latest check-in (0–100)">
          <HBars items={CREW.map((c) => ({ label: `${c.name} · ${c.role}`, value: c.mood, color: statusColor(c.mood > 74 ? 'Nominal' : c.mood > 62 ? 'Monitor' : 'Elevate') }))} />
        </Card>
        <Card title="Daily check-in" sub="Private self-report feeds the behavioral model">
          <form className="checkin" onSubmit={submit}>
            <label>Mood <b>{mood}/10</b><input type="range" min="1" max="10" value={mood} onChange={(e) => setMood(+e.target.value)} /></label>
            <label>Workload felt <b>{load}/10</b><input type="range" min="1" max="10" value={load} onChange={(e) => setLoad(+e.target.value)} /></label>
            <Btn variant="green">Submit check-in</Btn>
          </form>
          {logs.length > 0 && (
            <ul className="timeline-list">
              {logs.map((l, i) => <li key={i}><span>{l.t}</span><p>Mood {l.mood}/10 · Workload {l.load}/10</p></li>)}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ SLEEP */
function CircadianDial({ sleepStart, sleepHours, light }) {
  const R = 92;
  const arc = (from, to, r, color, w) => {
    const a = (h) => ((h / 24) * 360 - 90) * (Math.PI / 180);
    const [x1, y1] = [110 + r * Math.cos(a(from)), 110 + r * Math.sin(a(from))];
    const [x2, y2] = [110 + r * Math.cos(a(to)), 110 + r * Math.sin(a(to))];
    const large = (to - from + 24) % 24 > 12 ? 1 : 0;
    return <path d={`M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2}`} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />;
  };
  const end = (sleepStart + sleepHours) % 24;
  return (
    <svg viewBox="0 0 220 220" width="100%" style={{ maxWidth: 280 }}>
      <circle cx="110" cy="110" r={R} fill="none" stroke="rgba(120,150,230,.15)" strokeWidth="16" />
      {arc(sleepStart, end, R, '#5178dd', 16)}
      {light && arc(8, 14, R - 22, '#f5c542', 8)}
      {[0, 6, 12, 18].map((h) => {
        const a = ((h / 24) * 360 - 90) * (Math.PI / 180);
        return <text key={h} x={110 + 119 * Math.cos(a)} y={114 + 119 * Math.sin(a)} fontSize="11" fill="#8ea0cc" textAnchor="middle">{String(h).padStart(2, '0')}</text>;
      })}
      <text x="110" y="106" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">{sleepHours.toFixed(1)}h</text>
      <text x="110" y="126" textAnchor="middle" fill="#8ea0cc" fontSize="11">sleep window</text>
    </svg>
  );
}

export function Sleep() {
  const [crew, setCrew] = useCrew();
  const { notify } = useStore();
  const [plan, setPlan] = useState(false);
  const nights = ['D136', 'D137', 'D138', 'D139', 'D140', 'D141', 'D142'];
  const total = useMemo(() => series(crew, 7, crew.sleep, 1.2, crew.status === 'Nominal' ? 0.2 : -0.9), [crew]);
  const data = total.map((t, i) => {
    const r = rng(seedOf(crew) + i * 3);
    const deep = t * (0.17 + r() * 0.04);
    const rem = t * (0.2 + r() * 0.04);
    const awake = 0.3 + r() * 0.4;
    return { deep, rem, light: t - deep - rem, awake };
  });
  const debt = Math.max(0, +(crew.baseSleep * 7 - total.reduce((a, b) => a + b, 0)).toFixed(1));
  const fatigue = Math.min(100, Math.round(30 + debt * 9 + (crew.load - 55) * 0.5 + (plan ? -12 : 0)));
  const start = 22.5 + (crew.id === 'CM-003' ? 1.5 : 0) - (plan ? 1.5 : 0);

  return (
    <>
      <PageHead eyebrow="CREW HEALTH" title="Sleep & circadian" desc="Rest cycles, sleep debt and circadian alignment. Fatigue is a leading indicator of performance decrements." />
      <CrewPicker value={crew.id} onChange={setCrew} />
      <div className="grid g-3-1">
        <Card title="Sleep stages — last 7 nights" sub="Hours per night" right={<div className="legend row-legend"><span><i style={{ background: '#3b4fa8' }} /> Deep</span><span><i style={{ background: '#7ba3ff' }} /> REM</span><span><i style={{ background: '#2a3a6e' }} /> Light</span><span><i style={{ background: '#f97316' }} /> Awake</span></div>}>
          <StackedBars data={data} keys={['deep', 'rem', 'light', 'awake']} colors={['#3b4fa8', '#7ba3ff', '#2a3a6e', '#f97316']} labels={nights} height={230} />
        </Card>
        <Card title="Circadian phase" sub="24h clock · UTC">
          <div className="center"><CircadianDial sleepStart={start % 24} sleepHours={Math.min(9, total[6])} light={plan} /></div>
        </Card>
      </div>
      <div className="grid g3">
        <Card title="Sleep debt"><div className="big-num">{debt}<small> h</small></div><p className="muted small">vs. personal baseline of {crew.baseSleep} h/night</p></Card>
        <Card title="Fatigue risk"><div className="center"><Gauge value={fatigue} label="/100" color={fatigue > 65 ? '#ef4444' : fatigue > 45 ? '#f59e0b' : '#6ee3a3'} size={160} /></div></Card>
        <Card title="Circadian lighting plan" sub="Blue-enriched light AM, dim PM">
          <div className="row between"><span>{plan ? 'Plan active' : 'Plan inactive'}</span><Toggle on={plan} label="Circadian lighting plan" onChange={(v) => { setPlan(v); notify(v ? 'Circadian lighting plan applied' : 'Lighting plan disabled'); }} /></div>
          <p className="muted small">Shifts the sleep window earlier and lowers projected fatigue.</p>
        </Card>
      </div>
    </>
  );
}
