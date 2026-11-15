import React, { useMemo, useState } from 'react';
import { useNavigate } from '../router.jsx';
import Icon from '../components/Icon.jsx';
import { Btn, Card, PageHead, Pill, Toggle } from '../components/UI.jsx';
import { Heat, LineChart, statusColor } from '../components/Charts.jsx';
import { Globe, Tilt } from '../components/Visuals.jsx';
import { ALERTS, CREW, CREWS_GROUND, MISSION, PHASES, RISK_AREAS, RISK_MAP, SOURCES } from '../data.js';
import { download, ROLES, useStore } from '../store.jsx';

/* ---------------------------------------------------------- MISSION CONTROL */
export function MissionControl() {
  const nav = useNavigate();
  const { notify, alerts } = useStore();
  const [sel, setSel] = useState('ARES-07');
  const cur = CREWS_GROUND.find((c) => c.id === sel);
  const [sent, setSent] = useState({});
  const open = alerts.filter((a) => a.state !== 'resolved').length;
  const days = Array.from({ length: 14 }, (_, i) => `D${(cur.day - 13 + i)}`);
  const trend = useMemo(() => days.map((_, i) => Math.round(cur.readiness - 6 + Math.sin(i / 2 + cur.day) * 5 + i * 0.4)), [cur]);

  return (
    <>
      <PageHead eyebrow="OPERATIONS" title="Mission control" desc="Ground-side view of every crew in flight, with link status, risk signals and readiness at a glance." right={<Btn variant="outline" onClick={() => nav('/app/timeline')}>Open timeline</Btn>} />
      <div className="grid g4">
        {CREWS_GROUND.map((c) => (
          <Tilt key={c.id} as="button" max={9} className={`ground ${sel === c.id ? 'on' : ''}`} onClick={() => setSel(c.id)}>
            <span className="ground-top"><b>{c.id}</b><Pill status={c.status} /></span>
            <small>{c.phase} · Day {c.day}</small>
            <strong style={{ color: statusColor(c.status) }}>{c.readiness}<em>/100</em></strong>
            <span className="muted small">{c.signals} signals · link {c.link}</span>
          </Tilt>
        ))}
      </div>
      <div className="grid g-1-3">
        <Card title="Global crew map" sub="Simulated positions" className="mc-globe">
          <div className="center"><Globe size={300} /></div>
        </Card>
        <Card title={`${cur.id} — readiness trend`} sub={`${cur.phase} · Day ${cur.day} · link ${cur.link}`} right={
          <div className="row gap">
            <Btn variant="outline" onClick={() => nav('/app/dashboard')}>Open crew</Btn>
            <Btn variant="green" onClick={() => { setSent({ ...sent, [cur.id]: true }); notify(`Advisory sent to ${cur.id}`); }}>{sent[cur.id] ? 'Advisory sent ✓' : 'Send advisory'}</Btn>
          </div>
        }>
          <LineChart series={[{ name: 'Readiness', color: statusColor(cur.status), data: trend }]} labels={days} height={230} />
          <p className="muted small">{open} open alerts across the fleet. Select a crew above to switch the view.</p>
        </Card>
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- TIMELINE */
export function Timeline() {
  const [day, setDay] = useState(MISSION.day);
  const [pick, setPick] = useState(null);
  const total = MISSION.totalDays;
  const phase = PHASES.find((p) => day >= p.start && day <= p.end) || PHASES[2];
  const names = ['Minimal', 'Low', 'Watch', 'Elevated', 'High'];
  const phaseIdx = PHASES.indexOf(phase);

  return (
    <>
      <PageHead eyebrow="OPERATIONS" title="Timeline & mission phases" desc="Health risk mapped across mission stages, so countermeasures can be planned before the hardest phases begin." right={<Btn variant="outline" onClick={() => setDay(MISSION.day)}>Jump to today</Btn>} />
      <Card title={`Mission ARES-07 · Day ${day} of ${total}`} sub={`Current phase: ${phase.name}`}>
        <div className="phase-bar">
          {PHASES.map((p) => (
            <button key={p.id} className={p.id === phase.id ? 'on' : ''} style={{ flex: p.end - p.start + 1 }} onClick={() => setDay(Math.round((p.start + p.end) / 2))} title={`${p.name} (days ${p.days})`}>
              <span>{p.name}</span><small>Days {p.days}</small>
            </button>
          ))}
          <i className="now" style={{ left: `${(day / total) * 100}%` }} />
        </div>
        <input type="range" className="scrub" min="1" max={total} value={day} onChange={(e) => setDay(+e.target.value)} aria-label="Mission day" />
      </Card>
      <Card title="Risk map" sub="Click a cell for details — rows are risk areas, columns are mission phases">
        <Heat rows={RISK_AREAS} cols={PHASES.map((p) => p.name.split(' ')[0] + (p.id === 'tli' ? ' TLI' : ''))} values={RISK_AREAS.map((_, r) => PHASES.map((_, c) => RISK_MAP[c][r]))} onPick={(r, c, v) => setPick({ r, c, v })} />
        <div className="pick">
          {pick ? <><b>{pick.r}</b> during <b>{pick.c}</b>: <Pill status={pick.v >= 4 ? 'High' : pick.v === 3 ? 'Elevate' : pick.v === 2 ? 'Monitor' : 'Nominal'}>{names[pick.v]}</Pill> — plan countermeasures {pick.v >= 3 ? 'at least 10 days before this phase.' : 'as part of routine monitoring.'}</> : <>Current phase highest risks: {RISK_AREAS.filter((_, r) => RISK_MAP[phaseIdx][r] >= 3).join(', ') || 'none elevated'}.</>}
        </div>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ REPORTS */
const TYPES = {
  surgeon: { label: 'Flight surgeon summary', desc: 'Crew status, open alerts and recommended actions.' },
  review: { label: 'Reviewer evidence pack', desc: 'Predictions with the NASA sources behind them.' },
  weekly: { label: 'Weekly crew report', desc: 'Readiness trend and highlights for the crew.' },
};

export function Reports() {
  const { alerts, notify } = useStore();
  const [type, setType] = useState('surgeon');
  const [inc, setInc] = useState({ crew: true, alerts: true, actions: true, evidence: false });
  const open = alerts.filter((a) => a.state !== 'resolved');

  const text = () => {
    const L = [`CREWPULSE — ${TYPES[type].label.toUpperCase()}`, `Mission ARES-07 · Day ${MISSION.day} (simulated demo data)`, ''];
    if (inc.crew) L.push('CREW STATUS', ...CREW.map((c) => `- ${c.id} ${c.name}: readiness ${c.readiness}% (${c.status})`), '');
    if (inc.alerts) L.push('OPEN ALERTS', ...open.map((a) => `- [${a.severity}] ${a.crew} ${a.title}`), '');
    if (inc.actions) L.push('RECOMMENDED ACTIONS', '- Protect 8 h sleep opportunity for CM-003', '- Reduce non-critical task load by 15% for 48 h', '- Team debrief and shared meal block', '');
    if (inc.evidence) L.push('EVIDENCE', '- NASA HRP: Sleep Loss, Circadian Desynchronization, and Work Overload', '- NASA HRP: Behavioral Health & Performance', '');
    return L.join('\n');
  };
  const csv = () => 'id,name,role,readiness,status\n' + CREW.map((c) => [c.id, c.name, c.role, c.readiness, c.status].join(',')).join('\n');

  return (
    <>
      <PageHead eyebrow="OPERATIONS" title="Reports & export" desc="Summaries for flight surgeons and reviewers. Pick a template, choose what to include, and export." />
      <div className="grid g-report">
        <div className="stack-col-gap">
          <Card title="Template">
            <div className="tpl-list">
              {Object.entries(TYPES).map(([k, t]) => (
                <button key={k} className={`tpl ${type === k ? 'on' : ''}`} onClick={() => setType(k)}><b>{t.label}</b><small>{t.desc}</small></button>
              ))}
            </div>
          </Card>
          <Card title="Include">
            {[['crew', 'Crew status table'], ['alerts', 'Open alerts'], ['actions', 'Recommended actions'], ['evidence', 'NASA evidence references']].map(([k, l]) => (
              <div className="row between setting" key={k}><span>{l}</span><Toggle on={inc[k]} label={l} onChange={(v) => setInc({ ...inc, [k]: v })} /></div>
            ))}
          </Card>
          <div className="row gap wrap">
            <Btn variant="green" icon="download" onClick={() => { download('crewpulse-report.txt', text()); notify('Report downloaded'); }}>Download .txt</Btn>
            <Btn variant="outline" onClick={() => { download('crewpulse-crew.csv', csv(), 'text/csv'); notify('CSV downloaded'); }}>CSV</Btn>
            <Btn variant="outline" onClick={() => { const w = window.open('', '_blank'); if (!w) { notify('Allow pop-ups to export PDF'); return; } const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;'); w.document.write('<title>CrewPulse report</title><style>body{font:14px/1.6 Georgia,serif;max-width:720px;margin:40px auto;color:#111}h1{font-size:20px;border-bottom:2px solid #1b4fd8;padding-bottom:8px}pre{white-space:pre-wrap;font:13px/1.7 monospace}</style><h1>CrewPulse · ' + TYPES[type].label + '</h1><pre>' + esc(text()) + '</pre>'); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }}>Export PDF</Btn>
            <Btn variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(text()); notify('Copied to clipboard'); } catch { notify('Copy not available'); } }}>Copy</Btn>
          </div>
        </div>
        <Card title="Preview" className="paper-card">
          <pre className="paper">{text()}</pre>
        </Card>
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- SETTINGS */
export function Settings() {
  const nav = useNavigate();
  const { thresholds, setThresholds, sources, setSources, role, setRole, notify } = useStore();
  const sl = [
    { k: 'sleep', l: 'Minimum sleep per night', u: ' h', min: 4, max: 9, step: 0.5 },
    { k: 'hrv', l: 'HRV lower limit', u: ' ms', min: 20, max: 80, step: 1 },
    { k: 'stress', l: 'Stress alert level', u: '/100', min: 30, max: 90, step: 1 },
    { k: 'readiness', l: 'Readiness caution level', u: '%', min: 50, max: 95, step: 1 },
  ];
  const reset = () => {
    try { Object.keys(localStorage).filter((k) => k.startsWith('crewpulse:')).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
    notify('Demo data reset — reloading');
    setTimeout(() => window.location.reload(), 700);
  };
  return (
    <>
      <PageHead eyebrow="OPERATIONS" title="Settings & data sources" desc="Thresholds, sensors and connections. Changes apply instantly and are stored in this browser." />
      <div className="grid g2">
        <Card title="Alert thresholds">
          <div className="sliders">
            {sl.map((s) => (
              <label key={s.k} className="slider"><span>{s.l}<b>{thresholds[s.k]}{s.u}</b></span><input type="range" min={s.min} max={s.max} step={s.step} value={thresholds[s.k]} onChange={(e) => setThresholds({ ...thresholds, [s.k]: +e.target.value })} /></label>
            ))}
          </div>
        </Card>
        <Card title="Data sources & sensors">
          {SOURCES.map((s) => (
            <div className="row between setting" key={s.id}>
              <span><b>{s.name}</b><small className="block muted">{s.desc}</small></span>
              <Toggle on={sources[s.id]} label={s.name} onChange={(v) => { setSources({ ...sources, [s.id]: v }); notify(`${s.name} ${v ? 'connected' : 'disconnected'}`); }} />
            </div>
          ))}
        </Card>
      </div>
      <div className="grid g2">
        <Card title="Role">
          <div className="seg wrapseg">{Object.entries(ROLES).map(([k, r]) => <button key={k} className={role === k ? 'on' : ''} onClick={() => { setRole(k); notify(`Role set to ${r.label}`); }}>{r.label}</button>)}</div>
          <p className="muted small">Signed in as <b>{ROLES[role].user}</b>.</p>
          <Btn variant="outline" onClick={() => nav('/login')}>Open role selector</Btn>
        </Card>
        <Card title="Demo data">
          <p className="muted">All values are simulated. Reset to restore alerts, thresholds and CrewShield layers to defaults.</p>
          <Btn variant="outline" onClick={reset}>Reset demo data</Btn>
        </Card>
      </div>
    </>
  );
}
