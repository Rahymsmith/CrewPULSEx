import React from 'react';
import { useNavigate } from '../router.jsx';
import Icon from '../components/Icon.jsx';
import { Topbar } from '../components/Layout.jsx';
import { Starfield, Tilt } from '../components/Visuals.jsx';

const CHAIN = [
  { t: 'Crew health signals', d: 'Sleep, vitals, mood, cohesion and workload', c: '#6ee3a3' },
  { t: 'Human performance', d: 'Alertness, judgment, coordination', c: '#4d7cf2' },
  { t: 'Operational capability', d: 'EVA readiness, task success, response time', c: '#7ba3ff' },
  { t: 'Mission outcome', d: 'Schedule, objectives, safety margins', c: '#f97316' },
];

const FACTS = [
  { k: 'Isolation & confinement', v: 'Small crews, limited privacy, and long durations stress behavioral health and team cohesion.' },
  { k: 'Sleep & circadian disruption', v: 'Irregular light cycles and heavy workload reduce rest, alertness and performance.' },
  { k: 'Communication delay', v: 'Farther from Earth, real-time medical and psychological consult becomes limited or impossible.' },
  { k: 'Limited medical resources', v: 'Onboard capability must cover prevention, early detection and first response.' },
];

export default function Problem() {
  const nav = useNavigate();
  return (
    <div className="landing-page">
      <Starfield density={120} />
      <div className="landing-inner">
        <Topbar title="Problem & Mission" landing />
        <section className="l-challenge" style={{ paddingTop: 70 }}>
          <div className="kicker">PROBLEM &amp; MISSION</div>
          <h2 className="big-blue">Crew health decides mission success.</h2>
          <p className="lead">
            As missions move beyond low Earth orbit, a health or behavioral concern that would be routine on the ground can cascade into a mission-level risk. CrewPulse turns crew signals into early, evidence-backed decisions.
          </p>
        </section>

        <section className="chain">
          {CHAIN.map((c, i) => (
            <React.Fragment key={c.t}>
              <Tilt className="chain-node" max={10} style={{ '--c': c.c }}>
                <b>{c.t}</b>
                <span>{c.d}</span>
              </Tilt>
              {i < CHAIN.length - 1 && <Icon name="arrowRight" size={22} className="chain-arrow" />}
            </React.Fragment>
          ))}
        </section>

        <section className="facts">
          {FACTS.map((f) => (
            <div className="fact" key={f.k}>
              <h4>{f.k}</h4>
              <p>{f.v}</p>
            </div>
          ))}
        </section>

        <section className="mission-box">
          <div className="kicker green">OUR MISSION</div>
          <h3>Move from responding to emergencies to anticipating them.</h3>
          <p>CrewPulse is grounded in NASA’s Human Research Program risk evidence and Human System Risk Board (HSRB) framing for behavioral health and performance, and keeps working even when the link to Earth drops.</p>
          <div className="l-hero-cta" style={{ justifyContent: 'center' }}>
            <button className="btn green" onClick={() => nav('/login')}>
              Sign in &amp; choose role <Icon name="arrowRight" size={14} />
            </button>
            <button className="btn outline" onClick={() => nav('/')}>
              Back to home
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
