import React from 'react';
import { useNavigate } from '../router.jsx';
import Icon from '../components/Icon.jsx';
import { Topbar } from '../components/Layout.jsx';
import { Starfield, Tilt, Globe } from '../components/Visuals.jsx';

const asset = (f) => `${import.meta.env.BASE_URL}assets/${f}`;

const CHALLENGES = [
  { n: '01', t: 'PHYSICAL HEALTH', h: 'Physical Health Risks', p: 'Microgravity, changing physiological conditions, and demanding mission schedules can affect the body’s normal functioning and crew readiness.', icon: 'users' },
  { n: '02', t: 'WELLBEING', h: 'Behavioural & Mental Wellbeing', p: 'Isolation, stress, workload, and disrupted routines can affect an astronaut’s psychological wellbeing, focus, and performance.', icon: 'users' },
  { n: '03', t: 'CONNECTIVITY', h: 'Limited Communication with Earth', p: 'Communication delays and temporary blackouts can make continuous coordination with ground-based medical teams difficult.', icon: 'users' },
];

const POINTS = [
  'A unified view of crew health and mission readiness.',
  'Early identification of potential health risks.',
  'Health insights connected to supporting evidence.',
  'Scenario-based mission impact analysis.',
  'Access to essential information during communication disruptions.',
];

const USP = [
  { icon: 'rocket', h: 'Mission Impact Simulator', p: 'Change a health variable and watch mission outcomes shift.', to: '/app/simulator' },
  { icon: 'book', h: 'Evidence Mode', p: 'Every alert and prediction traced back to NASA HSRB sources.', to: '/app/evidence' },
  { icon: 'wifiOff', h: 'Offline EarthLink', p: 'Keeps working autonomously when the Earth connection drops.', to: '/app/earthlink' },
  { icon: 'shield', h: 'CrewShield', p: 'A layered crew-protection system with live mitigation status.', to: '/app/shield' },
];

export default function Landing() {
  const nav = useNavigate();
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="landing-page">
      <Starfield density={160} />
      <div className="landing-inner">
        <Topbar title="Overview" landing />

        <Tilt as="section" className="l-hero" max={2.2}>
          <img className="l-hero-img" src={asset('crew-hero.png')} alt="Astronaut crew in a spacecraft cabin" />
          <div className="l-hero-globe"><Globe size={420} dots={800} /></div>
          <div className="l-hero-fade" />
          <div className="l-hero-copy">
            <h1>
              Healthy Crew.
              <br />
              Successful Missions.
            </h1>
            <p>
              Space exploration demands more than advanced technology. It demands healthy, prepared, and resilient astronauts. CrewPULSE brings crew health intelligence and mission decision support into one connected platform.
            </p>
            <div className="l-hero-cta">
              <button className="btn blue" onClick={() => nav('/app/mission-control')}>
                Explore Mission Control <Icon name="arrowDown" size={14} />
              </button>
              <button className="btn outline" onClick={() => scrollTo('how')}>
                Discover how it works <Icon name="arrowDown" size={14} />
              </button>
            </div>
          </div>
        </Tilt>

        <section className="l-challenge" id="how">
          <div className="kicker">THE CHALLENGE</div>
          <h2 className="big-blue">Every Mission Depends on Its Crew.</h2>
          <p className="lead">Spaceflight places extraordinary physical and psychological demands on astronauts. Small health concerns can become significant mission challenges when they go unnoticed or unsupported.</p>
          <div className="l-cards">
            {CHALLENGES.map((c) => (
              <Tilt key={c.n} className="l-card" max={10}>
                <h4>
                  {c.n} / {c.t}
                </h4>
                <span className="l-card-ico">
                  <Icon name={c.icon} size={16} />
                </span>
                <h5>{c.h}</h5>
                <p>{c.p}</p>
              </Tilt>
            ))}
          </div>
          <button className="text-link" onClick={() => nav('/problem')}>
            Why crew health decides mission success <Icon name="arrowRight" size={14} />
          </button>
        </section>

        <section className="l-planets">
          <img src={asset('planets.png')} alt="Planets of the solar system" className="planets-img" />
          <h2 className="statement">
            A successful space mission requires a proactive approach to crew health — not just a response to emergencies.
          </h2>
          <div className="horizon" />
        </section>

        <section className="l-meet">
          <Tilt className="laptop-wrap" max={6}>
            <img src={asset('laptop.png')} alt="CrewPulse dashboard on a workstation" />
          </Tilt>
          <div className="l-meet-copy">
            <div className="kicker green">MEET CREWPULSE</div>
            <h2>
              Intelligence That Puts
              <br />
              Crew Health First.
            </h2>
            <p className="meet-p">
              <b>CrewPULSE</b> brings astronaut health information, risk intelligence, and mission decision support into one connected platform. It helps mission teams better understand crew conditions and respond to emerging concerns throughout every phase of spaceflight.
            </p>
            <ul className="checks">
              {POINTS.map((p) => (
                <li key={p}>
                  <span className="chk">
                    <Icon name="arrowUpRight" size={13} stroke={2.2} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <button className="btn green" onClick={() => nav('/app/dashboard')}>
              Explore the platform <Icon name="arrowRight" size={14} />
            </button>
          </div>
        </section>

        <section className="l-usp">
          <div className="kicker green">MISSIONSYNC INTELLIGENCE</div>
          <h2 className="big-blue sm">Four capabilities. One mission-ready crew.</h2>
          <div className="usp-grid">
            {USP.map((u) => (
              <Tilt key={u.h} className="usp" max={12} as="button" onClick={() => nav(u.to)}>
                <span className="chk big">
                  <Icon name={u.icon} size={20} />
                </span>
                <h4>{u.h}</h4>
                <p>{u.p}</p>
                <span className="usp-go">
                  Open <Icon name="arrowRight" size={13} />
                </span>
              </Tilt>
            ))}
          </div>
        </section>

        <footer className="l-foot">
          <span>© 2026 CrewPulse · NASA Space Apps Challenge · Crew Health Challenge</span>
          <span>
            <button onClick={() => nav('/login')}>Sign in</button>
            <button onClick={() => nav('/problem')}>Problem &amp; mission</button>
            <button onClick={() => nav('/app/dashboard')}>Dashboard</button>
          </span>
        </footer>
      </div>
    </div>
  );
}
