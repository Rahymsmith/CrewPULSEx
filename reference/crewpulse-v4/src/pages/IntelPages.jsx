import React, { useMemo, useState } from 'react';
import { useNavigate } from '../router.jsx';
import Icon from '../components/Icon.jsx';
import { Btn, Card, CrewPicker, PageHead, Pill, Sev, useCrew } from '../components/UI.jsx';
import { Gauge, HBars, LineChart, statusColor } from '../components/Charts.jsx';
import { Tilt } from '../components/Visuals.jsx';
import { ACTIONS, CREW, EVIDENCE } from '../data.js';
import { download, useStore } from '../store.jsx';

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));

/** Driver model shared by prediction + breakdown (transparent, rule-based demo model). */
export function drivers(c) {
  return [
    { k: 'Sleep deficit vs. baseline', v: clamp((c.baseSleep - c.sleep) * 9), ev: 'E-SLEEP', note: `${c.sleep} h vs ${c.baseSleep} h baseline` },
    { k: 'HRV suppression', v: clamp((c.baseHrv - c.hrv) * 0.9), ev: 'E-MED', note: `${c.hrv} ms vs ${c.baseHrv} ms baseline` },
    { k: 'Workload above plan', v: clamp((c.load - 60) * 1.1), ev: 'E-SLEEP', note: `${c.load}% of planned envelope` },
    { k: 'Perceived stress', v: clamp((c.stress - 30) * 0.7), ev: 'E-BHP', note: `Stress index ${c.stress}/100` },
    { k: 'Low mood / cohesion', v: clamp((75 - c.mood) * 0.8), ev: 'E-TEAM', note: `Mood index ${c.mood}/100` },
  ].map((d) => ({ ...d, v: Math.round(d.v) }));
}
export const riskScore = (c) => clamp(Math.round(drivers(c).reduce((a, d) => a + d.v, 0) * 0.55 + 6));

/* ------------------------------------------------------------- PREDICTION */
export function Prediction() {
  const [crew, setCrew] = useCrew();
  const { setEvidenceId } = useStore();
  const nav = useNavigate();
  const [hz, setHz] = useState(72);
  const base = riskScore(crew);
  const steps = hz / 12;
  const labels = ['Now', ...Array.from({ length: steps }, (_, i) => `+${(i + 1) * 12}h`)];
  const trend = crew.status === 'Nominal' ? 0.4 : crew.status === 'Monitor' ? 2.2 : 4.4;
  const data = labels.map((_, i) => clamp(base + trend * i + (i % 2 ? 1.2 : -0.6)));
  const band = { hi: data.map((v, i) => clamp(v + 3 + i * 1.4)), lo: data.map((v, i) => clamp(v - 3 - i * 1.4)) };

  const cats = [
    { name: 'Sleep & fatigue', p: clamp(base + 10), ev: 'E-SLEEP', up: crew.sleep < crew.baseSleep - 0.8 },
    { name: 'Behavioral health', p: clamp(base - 6 + (75 - crew.mood) * 0.3), ev: 'E-BHP', up: crew.mood < 65 },
    { name: 'Team cohesion', p: clamp(base - 12), ev: 'E-TEAM', up: crew.status !== 'Nominal' },
    { name: 'Medical / physiological', p: clamp(base - 4 + (crew.baseHrv - crew.hrv) * 0.2), ev: 'E-MED', up: crew.hrv < crew.baseHrv - 10 },
  ].map((c) => ({ ...c, p: Math.round(c.p) }));
  const color = (p) => (p > 60 ? '#ef4444' : p > 40 ? '#f97316' : p > 25 ? '#f59e0b' : '#6ee3a3');

  return (
    <>
      <PageHead
        eyebrow="INTELLIGENCE"
        title="AI risk prediction"
        desc="Forecast of health and behavioral risk for the next 72 hours, with an uncertainty band. Illustrative model on simulated data."
        right={<div className="seg">{[24, 48, 72].map((h) => <button key={h} className={hz === h ? 'on' : ''} onClick={() => setHz(h)}>{h}h</button>)}</div>}
      />
      <CrewPicker value={crew.id} onChange={setCrew} />
      <div className="grid g-1-3">
        <Card title="Composite risk">
          <div className="center"><Gauge value={base} label="now" size={190} color={color(base)} /></div>
          <p className="center-t"><Pill status={crew.status} /></p>
          <p className="muted small center-t">Projected {Math.round(data[data.length - 1])} at +{hz}h</p>
        </Card>
        <Card title={`Forecast — ${crew.name}`} sub="Risk index (0 = minimal, 100 = critical)">
          <LineChart series={[{ name: 'Risk', color: '#f97316', data }]} band={band} labels={labels} height={250} unit="" />
        </Card>
      </div>
      <div className="grid g4">
        {cats.map((c) => (
          <Tilt key={c.name} className="risk-tile" max={8}>
            <small>{c.name}</small>
            <b style={{ color: color(c.p) }}>{c.p}%</b>
            <div className="bar thin"><i style={{ width: `${c.p}%`, background: color(c.p) }} /></div>
            <span className="muted small">{c.up ? '▲ rising' : '▬ stable'}</span>
            <div className="row gap">
              <button className="chip" onClick={() => nav('/app/breakdown')}>Why?</button>
              <button className="chip" onClick={() => { setEvidenceId(c.ev); nav('/app/evidence'); }}>Evidence</button>
            </div>
          </Tilt>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------- BREAKDOWN */
export function Breakdown() {
  const [crew, setCrew] = useCrew();
  const { setEvidenceId } = useStore();
  const nav = useNavigate();
  const [sort, setSort] = useState(true);
  const ds = useMemo(() => {
    const d = drivers(crew);
    return sort ? [...d].sort((a, b) => b.v - a.v) : d;
  }, [crew, sort]);
  const total = riskScore(crew);
  const col = (v) => (v > 45 ? '#ef4444' : v > 25 ? '#f97316' : v > 10 ? '#f59e0b' : '#6ee3a3');

  return (
    <>
      <PageHead eyebrow="INTELLIGENCE" title="Risk breakdown" desc="The drivers behind each prediction — every contribution is traceable to a measured value and a NASA evidence source." right={<Btn variant="outline" onClick={() => setSort(!sort)}>{sort ? 'Sorted by impact' : 'Default order'}</Btn>} />
      <CrewPicker value={crew.id} onChange={setCrew} />
      <div className="grid g-1-3">
        <Card title="Overall risk"><div className="center"><Gauge value={total} label="risk index" size={190} color={col(total)} /></div></Card>
        <Card title="Contribution by driver" sub="Points added to the composite risk index">
          <HBars items={ds.map((d) => ({ label: d.k, value: d.v, color: col(d.v), signed: true }))} max={60} />
        </Card>
      </div>
      <Card title="Driver detail" sub="Click an evidence tag to open the source">
        <table className="tbl">
          <thead><tr><th>Driver</th><th>Measured</th><th>Contribution</th><th>Evidence</th></tr></thead>
          <tbody>
            {ds.map((d) => (
              <tr key={d.k}>
                <td>{d.k}</td>
                <td>{d.note}</td>
                <td><b style={{ color: col(d.v) }}>+{d.v}</b></td>
                <td><button className="chip" onClick={() => { setEvidenceId(d.ev); nav('/app/evidence'); }}>{d.ev}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

/* --------------------------------------------------------------- EVIDENCE */
export function Evidence() {
  const { evidenceId, setEvidenceId, alerts, notify } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const list = EVIDENCE.filter((e) => (e.title + e.risk + e.summary).toLowerCase().includes(q.toLowerCase()));
  const sel = EVIDENCE.find((e) => e.id === evidenceId) || EVIDENCE[0];
  const linked = alerts.filter((a) => a.evidence === sel.id);
  const cite = `${sel.title}. ${sel.org}. ${sel.year}. ${sel.url}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(cite); notify('Citation copied'); } catch { notify('Copy not available in this browser'); }
  };

  return (
    <>
      <PageHead eyebrow="INTELLIGENCE" title="Evidence Mode" desc="NASA Human Research Program and HSRB behavioral risk sources behind each alert and prediction. Nothing in CrewPulse is a black box." />
      <div className="grid g-evid">
        <div className="evid-list">
          <label className="search"><Icon name="search" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sources…" /></label>
          {list.map((e) => (
            <button key={e.id} className={`evid ${e.id === sel.id ? 'on' : ''}`} onClick={() => setEvidenceId(e.id)}>
              <span className="evid-id">{e.id}</span>
              <b>{e.risk}</b>
              <small>{e.org}</small>
            </button>
          ))}
          {!list.length && <p className="muted">No sources match.</p>}
        </div>
        <Card title={sel.risk} sub={`${sel.org} · ${sel.year}`} right={<Pill status={sel.confidence === 'High' ? 'Nominal' : 'Monitor'}>{sel.confidence} confidence</Pill>}>
          <h3 className="evid-title">{sel.title}</h3>
          <p className="evid-sum">{sel.summary}</p>
          <div className="row gap wrap">
            <a className="btn blue" href={sel.url} target="_blank" rel="noreferrer">Open NASA source <Icon name="arrowUpRight" size={14} /></a>
            <Btn variant="outline" onClick={copy}>Copy citation</Btn>
          </div>
          <h4 className="sub-h">Alerts supported by this evidence</h4>
          {linked.length === 0 && <p className="muted">No active alerts reference this source.</p>}
          <ul className="link-list">
            {linked.map((a) => (
              <li key={a.id}>
                <Sev level={a.severity} />
                <span><b>{a.crew}</b> · {a.title}</span>
                <button className="chip" onClick={() => nav('/app/alerts')}>Open</button>
              </li>
            ))}
          </ul>
          <p className="disclaimer">CrewPulse is a simulation prototype. References summarise public NASA research framing and are not medical guidance.</p>
        </Card>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ ALERTS */
export function AlertsCenter() {
  const { alerts, setAlerts, notify, setEvidenceId } = useStore();
  const nav = useNavigate();
  const [f, setF] = useState('All');
  const shown = alerts.filter((a) => (f === 'All' ? a.state !== 'resolved' : f === 'Resolved' ? a.state === 'resolved' : a.severity === f && a.state !== 'resolved'));
  const set = (id, state, msg) => { setAlerts(alerts.map((a) => (a.id === id ? { ...a, state } : a))); notify(msg); };
  const cnt = (l) => alerts.filter((a) => a.severity === l && a.state !== 'resolved').length;

  return (
    <>
      <PageHead eyebrow="INTELLIGENCE" title="Alerts center" desc="Prioritized warnings and escalations. Acknowledge, escalate to the flight surgeon, or resolve." right={<Btn variant="outline" onClick={() => { setAlerts(alerts.map((a) => ({ ...a, state: 'open' }))); notify('Alerts reset'); }}>Reset demo alerts</Btn>} />
      <div className="grid g3">
        {['High', 'Moderate', 'Low'].map((l) => (
          <button key={l} className={`sev-tile ${l.toLowerCase()}`} onClick={() => setF(l)}><small>{l}</small><b>{cnt(l)}</b></button>
        ))}
      </div>
      <div className="seg">{['All', 'High', 'Moderate', 'Low', 'Resolved'].map((x) => <button key={x} className={f === x ? 'on' : ''} onClick={() => setF(x)}>{x}</button>)}</div>
      <div className="alert-list">
        {shown.map((a) => (
          <article key={a.id} className={`alert ${a.severity.toLowerCase()} ${a.state}`}>
            <div className="alert-main">
              <div className="row gap wrap"><Sev level={a.severity} /><span className="tag">{a.category}</span><span className="muted small">{a.crew} · {a.time}</span>{a.state !== 'open' && <span className="tag st">{a.state}</span>}</div>
              <h4>{a.title}</h4>
              <p>{a.detail}</p>
              <p className="next"><b>Suggested next step:</b> {a.next}</p>
            </div>
            <div className="alert-actions">
              {a.state === 'open' && <Btn variant="outline" onClick={() => set(a.id, 'acknowledged', 'Alert acknowledged')}>Acknowledge</Btn>}
              {a.state !== 'resolved' && a.state !== 'escalated' && <Btn variant="blue" onClick={() => set(a.id, 'escalated', `${a.crew} escalated to Flight Surgeon`)}>Escalate</Btn>}
              {a.state !== 'resolved' ? <Btn variant="green" onClick={() => set(a.id, 'resolved', 'Alert resolved')}>Resolve</Btn> : <Btn variant="outline" onClick={() => set(a.id, 'open', 'Alert reopened')}>Reopen</Btn>}
              <button className="chip" onClick={() => { setEvidenceId(a.evidence); nav('/app/evidence'); }}>Evidence</button>
            </div>
          </article>
        ))}
        {!shown.length && <div className="empty">🎉 Nothing here — all clear.</div>}
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- ACTIONS */
export function Actions() {
  const { done, setDone, notify, setEvidenceId, setScenario } = useStore();
  const nav = useNavigate();
  const [crewF, setCrewF] = useState('All');
  const list = ACTIONS.filter((a) => crewF === 'All' || a.crew === crewF || a.crew === 'ALL');
  const total = ACTIONS.length;
  const n = ACTIONS.filter((a) => done[a.id]).length;
  const pc = { High: '#ef4444', Medium: '#f97316', Low: '#6ee3a3' };

  return (
    <>
      <PageHead eyebrow="INTELLIGENCE" title="Recommended actions" desc="Countermeasures and next steps ranked by impact. Each action is linked to its evidence and can be tested in the simulator first." right={<Btn variant="outline" icon="download" onClick={() => { download('crewpulse-actions.csv', 'id,crew,action,priority,owner,done\n' + ACTIONS.map((a) => [a.id, a.crew, `"${a.title}"`, a.priority, a.owner, !!done[a.id]].join(',')).join('\n'), 'text/csv'); notify('Action plan exported'); }}>Export plan</Btn>} />
      <div className="grid g-1-3">
        <Card title="Plan progress"><div className="center"><Gauge value={(n / total) * 100} label={`${n}/${total} done`} size={180} /></div></Card>
        <div>
          <div className="seg"><button className={crewF === 'All' ? 'on' : ''} onClick={() => setCrewF('All')}>All crew</button>{['CM-002', 'CM-003', 'CM-004'].map((c) => <button key={c} className={crewF === c ? 'on' : ''} onClick={() => setCrewF(c)}>{c}</button>)}</div>
          <div className="action-list">
            {list.map((a) => (
              <div key={a.id} className={`action ${done[a.id] ? 'done' : ''}`}>
                <button className="check" onClick={() => { setDone({ ...done, [a.id]: !done[a.id] }); notify(done[a.id] ? 'Marked as open' : 'Action completed'); }} aria-label="Toggle complete" aria-pressed={!!done[a.id]}>{done[a.id] && <Icon name="check" size={16} />}</button>
                <div className="action-body">
                  <b>{a.title}</b>
                  <span className="muted small">{a.crew} · {a.type} · Owner: {a.owner}</span>
                </div>
                <span className="pill" style={{ color: pc[a.priority], background: pc[a.priority] + '18', borderColor: pc[a.priority] + '55' }}>{a.priority}</span>
                <button className="chip" onClick={() => { setEvidenceId(a.evidence); nav('/app/evidence'); }}>Evidence</button>
                <button className="chip" onClick={() => { setScenario(a.type); nav('/app/simulator'); }}>Simulate</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
