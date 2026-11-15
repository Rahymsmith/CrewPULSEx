import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from '../router.jsx';
import Icon from '../components/Icon.jsx';
import { Donut, LineChart, statusColor } from '../components/Charts.jsx';
import { CREW, TREND, TREND_DAYS } from '../data.js';
import { download, useStore } from '../store.jsx';

const asset = (f) => `${import.meta.env.BASE_URL}assets/${f}`;

const RANGES = { 7: 'Last 7 days', 14: 'Last 14 days', 30: 'Last 30 days' };

export default function Dashboard() {
  const nav = useNavigate();
  const { alerts, notify, setCrewId } = useStore();
  const [range, setRange] = useState(7);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [riskOpen, setRiskOpen] = useState('High');
  const rangeRef = useRef(null);

  useEffect(() => {
    const h = (e) => rangeRef.current && !rangeRef.current.contains(e.target) && setRangeOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const open = alerts.filter((a) => a.state !== 'resolved');
  const byLevel = (l) => open.find((a) => a.severity === l);
  const counts = { High: 0, Moderate: 0, Low: 0 };
  open.forEach((a) => (counts[a.severity] += 1));

  const readiness = Math.round(CREW.reduce((a, c) => a + c.readiness, 0) / CREW.length);
  const data = TREND[range];
  const labels = range === 7 ? TREND_DAYS.map((d) => `DAY ${d}`) : data.map((_, i) => `D${142 - (data.length - 1 - i)}`);

  const exportSummary = () => {
    const lines = [
      'CREWPULSE — CREW HEALTH SUMMARY',
      'Mission: ARES-07 · Lunar transit · Day 142 (simulated demo data)',
      `Crew readiness: ${readiness}/100`,
      `Open alerts: ${open.length} (${counts.High} high, ${counts.Moderate} moderate, ${counts.Low} low)`,
      '',
      'CREW STATUS',
      ...CREW.map((c) => `${c.id} · ${c.name} — readiness ${c.readiness}% — ${c.status}`),
    ];
    download('crewpulse-summary-day142.txt', lines.join('\n'));
    notify('Summary exported');
  };

  const rows = showAll ? CREW : CREW.slice(0, 4);
  const stat = (to) => () => nav(to);

  return (
    <div className="dash">
      {/* HERO */}
      <section className="dash-hero">
        <div className="dash-hero-bg" />
        <img className="dash-hero-img" src={asset('astronaut.png')} alt="Astronaut giving a thumbs up" />
        <div className="dash-hero-fade" />
        <div className="dash-hero-copy">
          <h1>Crew Health Dashboard</h1>
          <p>Monitor crew readiness and mission health at a glance</p>
          <button className="btn green sm" onClick={exportSummary}>
            Export Summary <Icon name="download" size={13} />
          </button>
        </div>
        <button className="hero-arrow" onClick={() => nav('/app/prediction')} aria-label="Open AI risk prediction">
          <Icon name="arrowUpRight" size={13} stroke={2.4} />
        </button>

        <div className="risk-card">
          <div className="risk-head">
            <b>Risk distribution</b>
            <button className="mini-ico" onClick={() => nav('/app/breakdown')} aria-label="Open risk breakdown">
              <Icon name="layers" size={11} />
            </button>
          </div>
          <small>Illustrative crew signal mix</small>
          <div className="risk-donut">
            <Donut
              size={104}
              thickness={20}
              gap={5}
              parts={[
                { value: 30, color: '#4fb8f0' },
                { value: 30, color: '#f97316' },
                { value: 40, color: '#3d8fe8' },
              ]}
            />
          </div>
          <div className="legend">
            <span>
              <i style={{ background: '#4fb8f0' }} /> Elevate
            </span>
            <span>
              <i style={{ background: '#f97316' }} /> Moderate
            </span>
            <span>
              <i style={{ background: '#a3e635' }} /> Low
            </span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <button className="stat" onClick={stat('/app/profile')}>
          <span className="stat-top">
            <span>Crew Readiness</span>
            <span className="tile"><Icon name="users" size={13} /></span>
          </span>
          <b className="stat-val green">{readiness}/100</b>
          <span className="stat-sub green"><Icon name="trendUp" size={15} /> 3.2% this cycle</span>
        </button>
        <button className="stat" onClick={stat('/app/vitals')}>
          <span className="stat-top">
            <span>Active Crew</span>
            <span className="tile"><Icon name="users" size={13} /></span>
          </span>
          <b className="stat-val">06/06</b>
          <span className="stat-sub green"><Icon name="trendUp" size={15} /> All members accounted for</span>
        </button>
        <button className="stat" onClick={stat('/app/alerts')}>
          <span className="stat-top">
            <span>Risk Signals</span>
            <span className="tile orange"><Icon name="alert" size={13} /></span>
          </span>
          <b className="stat-val orange">{String(counts.High + counts.Moderate).padStart(2, '0')}</b>
          <span className="stat-sub orange">
            <Icon name="trendUp" size={15} /> {counts.High} high - {counts.Moderate} Moderate
          </span>
        </button>
        <button className="stat" onClick={stat('/app/earthlink')}>
          <span className="stat-top">
            <span>System Status</span>
            <span className="tile"><Icon name="users" size={13} /></span>
          </span>
          <b className="stat-val green">NOMINAL</b>
          <span className="stat-sub">Ground Connection active</span>
        </button>
      </section>

      {/* TREND */}
      <section className="trend">
        <div className="trend-head">
          <div>
            <h2>Crew Readiness Trend</h2>
            <p>Composite demo index - {RANGES[range]}</p>
          </div>
          <div className="range" ref={rangeRef}>
            <button className="range-btn" onClick={() => setRangeOpen(!rangeOpen)} aria-haspopup="listbox" aria-expanded={rangeOpen}>
              {range} DAYS
            </button>
            {rangeOpen && (
              <ul className="range-menu" role="listbox">
                {[7, 14, 30].map((r) => (
                  <li key={r}>
                    <button
                      className={r === range ? 'on' : ''}
                      onClick={() => {
                        setRange(r);
                        setRangeOpen(false);
                      }}
                    >
                      {r} DAYS
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <LineChart light height={250} series={[{ name: 'Readiness', color: '#1b2a6b', fill: '#7b9cf5', data }]} labels={labels} yTicks={[0, 25, 50, 75, 100]} />
      </section>

      {/* STATUS + PRIORITY */}
      <section className="bottom">
        <div className="status-card">
          <div className="status-head">
            <h2>Crew Status</h2>
            <button className="view-all" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show less' : 'View All'} <span className="va-ico"><Icon name="arrowUpRight" size={12} stroke={2.4} /></span>
            </button>
          </div>
          <table className="crew-table">
            <thead>
              <tr>
                <th>CREW MEMBER</th>
                <th>READINESS</th>
                <th>STATUS</th>
                <th>LAST UPDATE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  tabIndex={0}
                  onClick={() => {
                    setCrewId(c.id);
                    nav('/app/profile');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (setCrewId(c.id), nav('/app/profile'))}
                >
                  <td>
                    <b>{c.id} · {c.name}</b>
                  </td>
                  <td>{c.readiness}%</td>
                  <td style={{ color: statusColor(c.status), fontWeight: 600 }}>{c.status}</td>
                  <td>2mins ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="priority">
          <div className="priority-head">
            <b>Priority alert</b>
            <button className="mini-ico amber" onClick={() => nav('/app/alerts')} aria-label="Open alerts center">
              <Icon name="bell" size={11} />
            </button>
          </div>
          <small>Quick action required</small>
          {['High', 'Moderate', 'Low'].map((lvl) => {
            const a = byLevel(lvl);
            const dot = lvl === 'Low' ? '#a3e635' : '#f97316';
            const expanded = riskOpen === lvl;
            return (
              <div className="p-item" key={lvl}>
                <button className="p-dot" style={{ background: dot }} onClick={() => setRiskOpen(expanded ? null : lvl)} aria-label={`${lvl} alert`} />
                {lvl === 'High' && a ? (
                  <p>
                    <button className="p-link" onClick={() => nav('/app/alerts')}>
                      <b>{a.crew}</b> · {a.title.replace('Sleep duration below personal baseline', 'Sleep duration below personal baseline')}
                    </button>
                    {expanded && (
                      <>
                        {' '}for 2 consecutive cycles. Suggested next step: {a.next.charAt(0).toLowerCase() + a.next.slice(1)}
                      </>
                    )}
                  </p>
                ) : (
                  <p>
                    <button className="p-link plain" onClick={() => setRiskOpen(expanded ? null : lvl)}>{lvl}</button>
                    {expanded && a && (
                      <span className="p-more">
                        <b>{a.crew}</b> · {a.title}. {a.next}
                      </span>
                    )}
                    {expanded && !a && <span className="p-more">No open {lvl.toLowerCase()} alerts.</span>}
                  </p>
                )}
              </div>
            );
          })}
        </aside>
      </section>
    </div>
  );
}
