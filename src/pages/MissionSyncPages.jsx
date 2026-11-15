import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Btn, Card, PageHead, Toggle } from '../components/UI.jsx';
import { Gauge, HBars } from '../components/Charts.jsx';
import { Globe, ShieldRings, Tilt } from '../components/Visuals.jsx';
import { SHIELD_LAYERS } from '../data.js';
import { useStore } from '../store.jsx';

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));

/* -------------------------------------------------------------- SIMULATOR */
const DEFAULTS = { sleep: 7.2, workload: 60, stress: 28, cohesion: 78 };
const PRESETS = {
  Nominal: DEFAULTS,
  'Sleep loss': { sleep: 4.8, workload: 62, stress: 40, cohesion: 74 },
  'Workload surge': { sleep: 6.6, workload: 105, stress: 55, cohesion: 70 },
  'Combined strain': { sleep: 5.0, workload: 98, stress: 72, cohesion: 52 },
  Countermeasure: { sleep: 8.0, workload: 52, stress: 22, cohesion: 82 },
  Workload: { sleep: 6.6, workload: 105, stress: 55, cohesion: 70 },
};

export function simulate(v) {
  const sleepPen = clamp((7.2 - v.sleep) * 9, 0, 40) + clamp((v.sleep - 8.5) * 2, 0, 6);
  const loadPen = clamp((v.workload - 70) * 0.55, 0, 30);
  const stressPen = clamp((v.stress - 30) * 0.45, 0, 32);
  const cohPen = clamp((75 - v.cohesion) * 0.5, 0, 14);
  const readiness = clamp(Math.round(97 - sleepPen - loadPen * 0.8 - stressPen * 0.7 - cohPen));
  const eva = clamp(Math.round(readiness * 0.98 + 2 - (v.sleep < 5.5 ? 8 : 0)));
  const tasks = clamp(Math.round(readiness * 0.9 + 8 - loadPen * 0.4));
  const delay = +(Math.max(0, (90 - readiness) * 0.18)).toFixed(1);
  const safety = clamp(Math.round(100 - (100 - readiness) * 0.9 - stressPen * 0.3));
  const success = clamp(Math.round(readiness * 0.5 + eva * 0.2 + tasks * 0.15 + safety * 0.15));
  return { readiness, eva, tasks, delay, safety, success };
}

function Trajectory({ progress, color }) {
  // Earth → Moon arc with a spacecraft marker that depends on schedule slip
  const t = clamp(progress, 0, 100) / 100;
  const pt = (u) => {
    const x = 40 + u * 420;
    const y = 120 - Math.sin(u * Math.PI) * 78;
    return [x, y];
  };
  const [x, y] = pt(0.68 * (0.7 + 0.3 * t));
  return (
    <svg viewBox="0 0 500 170" width="100%" className="traj">
      <defs>
        <radialGradient id="earth" cx="35%" cy="35%"><stop offset="0" stopColor="#7ec3ff" /><stop offset="1" stopColor="#1c4d9c" /></radialGradient>
        <radialGradient id="moon" cx="35%" cy="35%"><stop offset="0" stopColor="#f1f1f1" /><stop offset="1" stopColor="#8c8c96" /></radialGradient>
      </defs>
      <circle cx="40" cy="120" r="22" fill="url(#earth)" />
      <circle cx="460" cy="120" r="11" fill="url(#moon)" />
      <path d="M40 120 Q250 -36 460 120" fill="none" stroke="rgba(120,150,230,.5)" strokeDasharray="4 6" />
      <path d={`M40 120 Q${40 + 210 * 0.68} ${120 - 156 * 0.34 * 0.68} ${x} ${y}`} fill="none" stroke={color} strokeWidth="2.5" />
      <g transform={`translate(${x} ${y})`}>
        <circle r="9" fill={color} opacity=".25"><animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" /></circle>
        <circle r="4.5" fill={color} />
      </g>
      <text x="40" y="160" fill="#8ea0cc" fontSize="11" textAnchor="middle">Earth</text>
      <text x="460" y="150" fill="#8ea0cc" fontSize="11" textAnchor="middle">Moon</text>
    </svg>
  );
}

export function Simulator() {
  const { scenario, setScenario, notify } = useStore();
  const [v, setV] = useState(scenario ? PRESETS[scenario] || PRESETS.Countermeasure : DEFAULTS);
  const [saved, setSaved] = useState([]);
  useEffect(() => {
    if (scenario) { setV(PRESETS[scenario] || PRESETS.Countermeasure); setScenario(null); }
  }, [scenario, setScenario]);

  const base = useMemo(() => simulate(DEFAULTS), []);
  const out = useMemo(() => simulate(v), [v]);
  const col = out.success > 80 ? '#6ee3a3' : out.success > 62 ? '#f59e0b' : '#ef4444';
  const set = (k) => (e) => setV({ ...v, [k]: +e.target.value });
  const delta = (a, b) => { const d = Math.round((a - b) * 10) / 10; return d === 0 ? '±0' : (d > 0 ? '+' : '') + d; };

  const sliders = [
    { k: 'sleep', l: 'Sleep per night', u: ' h', min: 3.5, max: 9, step: 0.1 },
    { k: 'workload', l: 'Workload vs. plan', u: '%', min: 40, max: 130, step: 1 },
    { k: 'stress', l: 'Stress index', u: '/100', min: 10, max: 95, step: 1 },
    { k: 'cohesion', l: 'Team cohesion', u: '/100', min: 30, max: 95, step: 1 },
  ];
  const metrics = [
    { l: 'Crew readiness', a: out.readiness, b: base.readiness, u: '%' },
    { l: 'EVA success probability', a: out.eva, b: base.eva, u: '%' },
    { l: 'Task completion', a: out.tasks, b: base.tasks, u: '%' },
    { l: 'Safety margin', a: out.safety, b: base.safety, u: '%' },
  ];

  return (
    <>
      <PageHead
        eyebrow="MISSIONSYNC INTELLIGENCE"
        title="Mission Impact Simulator"
        desc="Change a crew health variable and watch mission outcomes shift. Scenario model for decision support — not a prediction of any real mission."
        right={<Btn variant="outline" onClick={() => { setV(DEFAULTS); notify('Simulator reset'); }}>Reset</Btn>}
      />
      <div className="seg wrapseg">
        {['Nominal', 'Sleep loss', 'Workload surge', 'Combined strain', 'Countermeasure'].map((p) => (
          <button key={p} onClick={() => setV(PRESETS[p])} className={JSON.stringify(PRESETS[p]) === JSON.stringify(v) ? 'on' : ''}>{p}</button>
        ))}
      </div>
      <div className="grid g-sim">
        <Card title="Health variables" sub="Drag to change the crew condition">
          <div className="sliders">
            {sliders.map((s) => (
              <label key={s.k} className="slider">
                <span>{s.l}<b>{s.k === 'sleep' ? v[s.k].toFixed(1) : v[s.k]}{s.u}</b></span>
                <input type="range" min={s.min} max={s.max} step={s.step} value={v[s.k]} onChange={set(s.k)} />
              </label>
            ))}
          </div>
          <Btn variant="blue" onClick={() => { setSaved([{ n: saved.length + 1, v, o: out }, ...saved].slice(0, 4)); notify('Scenario saved'); }}>Save scenario</Btn>
        </Card>
        <Card title="Mission outcome" sub="Scenario vs. nominal baseline" className="sim-out">
          <div className="sim-top">
            <Gauge value={out.success} label="mission success" color={col} size={200} />
            <div className="sim-kpis">
              <div><small>Schedule slip</small><b style={{ color: out.delay > 3 ? '#ef4444' : out.delay > 0.5 ? '#f59e0b' : '#6ee3a3' }}>+{out.delay} d</b></div>
              <div><small>Δ success vs. nominal</small><b style={{ color: out.success >= base.success ? '#6ee3a3' : '#f97316' }}>{delta(out.success, base.success)} pts</b></div>
            </div>
          </div>
          <Trajectory progress={out.success} color={col} />
          <div className="metric-list">
            {metrics.map((m) => (
              <div key={m.l} className="metric">
                <span>{m.l}</span>
                <div className="bar thin"><i style={{ width: `${m.a}%`, background: m.a > 80 ? '#6ee3a3' : m.a > 62 ? '#f59e0b' : '#ef4444' }} /></div>
                <b>{m.a}{m.u}</b>
                <em style={{ color: m.a >= m.b ? '#6ee3a3' : '#f97316' }}>{delta(m.a, m.b)}</em>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {saved.length > 0 && (
        <Card title="Saved scenarios">
          <div className="grid g4">
            {saved.map((s) => (
              <button key={s.n} className="chip-card" onClick={() => setV(s.v)}>
                <b>Scenario {s.n}</b>
                <span>Success {s.o.success}% · slip +{s.o.delay} d</span>
                <small>Sleep {s.v.sleep}h · Load {s.v.workload}% · Stress {s.v.stress}</small>
              </button>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

/* ------------------------------------------------------------- CREWSHIELD */
const THREATS = [
  { t: 'Sleep restriction event', layer: 'circ' },
  { t: 'Rising isolation stress', layer: 'psy' },
  { t: 'Unflagged physiological drift', layer: 'mon' },
  { t: 'Delayed medical consult', layer: 'auto' },
  { t: 'Cascading workload overload', layer: 'pred' },
];

export function CrewShield() {
  const { layers, setLayers, notify } = useStore();
  const [scan, setScan] = useState(-1);
  const active = SHIELD_LAYERS.filter((l) => layers[l.id]);
  const score = active.reduce((a, l) => a + l.weight, 0);
  const col = score > 85 ? '#6ee3a3' : score > 55 ? '#f59e0b' : '#ef4444';

  const diagnostics = () => {
    let i = 0;
    setScan(0);
    const t = setInterval(() => {
      i += 1;
      if (i >= SHIELD_LAYERS.length) { clearInterval(t); setScan(-1); notify(`Diagnostics complete — ${active.length}/${SHIELD_LAYERS.length} layers healthy`); }
      else setScan(i);
    }, 600);
  };

  return (
    <>
      <PageHead eyebrow="MISSIONSYNC INTELLIGENCE" title="CrewShield" desc="The crew protection layer: five mitigation layers working together. Toggle layers to see how protection coverage changes." right={<Btn variant="green" onClick={diagnostics}>Run diagnostics</Btn>} />
      <div className="grid g-shield">
        <Card className="shield-card">
          <ShieldRings layers={SHIELD_LAYERS.map((l) => ({ id: l.id, on: layers[l.id] }))} />
          <div className="shield-score" style={{ color: col }}>{score}%<small>protection coverage</small></div>
        </Card>
        <div className="layer-list">
          {SHIELD_LAYERS.map((l, i) => (
            <div key={l.id} className={`layer ${layers[l.id] ? 'on' : 'off'} ${scan === i ? 'scan' : ''}`}>
              <span className="layer-n">{i + 1}</span>
              <div>
                <b>{l.name}</b>
                <p>{l.desc}</p>
                <small>{scan === i ? 'Scanning…' : layers[l.id] ? `Active · +${l.weight}% coverage` : 'Disabled — coverage gap'}</small>
              </div>
              <Toggle on={layers[l.id]} label={l.name} onChange={(v) => { setLayers({ ...layers, [l.id]: v }); notify(`${l.name} ${v ? 'enabled' : 'disabled'}`); }} />
            </div>
          ))}
        </div>
      </div>
      <Card title="Threat coverage" sub="Which layer mitigates which mission threat">
        <div className="threats">
          {THREATS.map((t) => {
            const on = layers[t.layer];
            const L = SHIELD_LAYERS.find((l) => l.id === t.layer);
            return (
              <div key={t.t} className={`threat ${on ? 'ok' : 'gap'}`}>
                <Icon name={on ? 'shield' : 'alert'} size={18} />
                <span>{t.t}</span>
                <small>{on ? `Mitigated by ${L.name}` : `Exposed — enable ${L.name}`}</small>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

/* --------------------------------------------------------------- EARTHLINK */
const PROTOCOLS = {
  'Sleep deprivation': ['Confirm sleep opportunity ≥ 8 h in next cycle', 'Dim cabin lights 2 h before sleep window', 'Reduce non-critical tasks by 15%', 'Re-check alertness after 48 h'],
  'Elevated stress': ['Offer private psychological support session (cached content)', 'Schedule a team meal / debrief block', 'Guided breathing routine, 10 min', 'Log mood twice daily'],
  'Minor injury': ['Assess with onboard medical checklist', 'Apply first-response protocol from local cache', 'Queue a report for the next ground contact', 'Re-assess in 6 h'],
};

export function EarthLink() {
  const { linkOnline, setLinkOnline, notify } = useStore();
  const [queue, setQueue] = useState(0);
  const [age, setAge] = useState(0);
  const [proto, setProto] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (linkOnline) return undefined;
    const i = setInterval(() => { setQueue((q) => q + 1); setAge((a) => a + 1); }, 1400);
    return () => clearInterval(i);
  }, [linkOnline]);

  const toggle = () => {
    if (linkOnline) { setLinkOnline(false); setAge(0); notify('Ground link lost — Offline EarthLink engaged'); }
    else {
      setLinkOnline(true);
      setSyncing(true);
      notify('Link restored — syncing queued data');
      clearTimeout(ref.current);
      ref.current = setTimeout(() => { setSyncing(false); setQueue(0); notify('Sync complete'); }, 1800);
    }
  };

  return (
    <>
      <PageHead eyebrow="MISSIONSYNC INTELLIGENCE" title="Offline EarthLink" desc="When contact with Earth drops, CrewPulse switches to autonomous mode: local risk scoring, cached protocols and a store-and-forward queue." right={<Btn variant={linkOnline ? 'blue' : 'green'} onClick={toggle}>{linkOnline ? 'Simulate link loss' : 'Restore link'}</Btn>} />
      <div className="grid g-link">
        <Card className={`link-globe ${linkOnline ? '' : 'lost'}`}>
          <div className="globe-center"><Globe size={340} color={linkOnline ? '110,160,255' : '249,115,22'} /></div>
          <div className={`link-state ${linkOnline ? 'ok' : 'lost'}`}>
            <Icon name={linkOnline ? 'satellite' : 'wifiOff'} size={18} />
            {linkOnline ? 'Ground link nominal · latency 1.3 s' : 'Link lost · autonomous mode active'}
          </div>
        </Card>
        <div className="stack-col-gap">
          <div className="grid g3">
            <Tilt className="risk-tile" max={6}><small>Mode</small><b style={{ color: linkOnline ? '#6ee3a3' : '#f97316', fontSize: 20 }}>{linkOnline ? 'Connected' : 'Autonomous'}</b></Tilt>
            <Tilt className="risk-tile" max={6}><small>Queued for Earth</small><b>{queue}</b><span className="muted small">{syncing ? 'Syncing…' : 'records'}</span></Tilt>
            <Tilt className="risk-tile" max={6}><small>Cache age</small><b>{linkOnline ? '0' : age}<span className="unit"> min</span></b><span className="muted small">local models current</span></Tilt>
          </div>
          <Card title="Onboard decision support" sub="Works with no connection — protocols cached on the habitat server">
            <div className="seg wrapseg">{Object.keys(PROTOCOLS).map((p) => <button key={p} className={proto === p ? 'on' : ''} onClick={() => setProto(p)}>{p}</button>)}</div>
            {proto ? (
              <ol className="proto">{PROTOCOLS[proto].map((s) => <li key={s}>{s}</li>)}</ol>
            ) : (
              <p className="muted">Choose a situation to load the cached protocol.</p>
            )}
          </Card>
          <Card title="What keeps running offline">
            <ul className="ok-list">
              {['Continuous biosensor capture', 'On-device risk scoring', 'Alerts and recommended actions', 'Store-and-forward queue for ground teams'].map((x) => (
                <li key={x}><Icon name="check" size={16} /> {x}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
