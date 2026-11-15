import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from '../router.jsx';
import Icon from './Icon.jsx';
import { Logo } from './Visuals.jsx';
import { MISSION, NAV } from '../data.js';
import { useStore } from '../store.jsx';

function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')} UTC`;
}

export function Avatar({ size = 28 }) {
  return <img src={`${import.meta.env.BASE_URL}assets/avatar.png`} alt="" className="avatar" style={{ width: size, height: size }} />;
}

export function Topbar({ title, onMenu, landing }) {
  const nav = useNavigate();
  const clock = useClock();
  const { alerts, roleInfo, linkOnline, role, notify } = useStore();
  const [bell, setBell] = useState(false);
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setBell(false);
        setMenu(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const open = alerts.filter((a) => a.state === 'open');

  return (
    <header className={`topbar ${landing ? 'landing' : ''}`} ref={ref}>
      {onMenu && (
        <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open menu">
          <Icon name="menu" />
        </button>
      )}
      <button className="crumb" onClick={() => nav('/')} title="Back to home">
        Workspace/<span>{title}</span>
      </button>
      <div className="topbar-right">
        <span className="env">
          <span className={`dot ${linkOnline ? 'ok' : 'warn'}`} /> {linkOnline ? 'Simulation Environment' : 'Autonomous Mode'}
        </span>
        <span className="clock">
          <span className="pulse-dot" /> {clock}
        </span>
        <div className="pop-wrap">
          <button className="icon-btn bell" onClick={() => { setBell(!bell); setMenu(false); }} aria-label="Notifications">
            <Icon name="bell" size={20} />
            {open.length > 0 && <i className="badge">{open.length}</i>}
          </button>
          {bell && (
            <div className="popover">
              <div className="pop-title">Notifications</div>
              {open.slice(0, 4).map((a) => (
                <button key={a.id} className="pop-item" onClick={() => { setBell(false); nav('/app/alerts'); }}>
                  <span className={`sev ${a.severity.toLowerCase()}`} />
                  <span><b>{a.crew}</b> · {a.title}<small>{a.time}</small></span>
                </button>
              ))}
              {open.length === 0 && <div className="pop-empty">No open alerts</div>}
              <button className="pop-link" onClick={() => { setBell(false); nav('/app/alerts'); }}>Open alerts center →</button>
            </div>
          )}
        </div>
        <div className="pop-wrap">
          <button className="user" onClick={() => { setMenu(!menu); setBell(false); }}>
            <Avatar size={28} />
            <span className="user-text">
              <b>{roleInfo.user}</b>
              <small>{roleInfo.tag}</small>
            </span>
            <span className="caret" />
          </button>
          {menu && (
            <div className="popover right">
              <div className="pop-title">Signed in as {roleInfo.label}</div>
              <button className="pop-item" onClick={() => { setMenu(false); nav('/login'); }}>Switch role</button>
              <button className="pop-item" onClick={() => { setMenu(false); nav('/app/settings'); }}>Settings</button>
              <button className="pop-item" onClick={() => { setMenu(false); notify('Signed out of demo session'); nav('/'); }}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function Sidebar({ open, onClose }) {
  const { linkOnline } = useStore();
  const nav = useNavigate();
  return (
    <>
      <div className={`scrim ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <button className="logo-btn" onClick={() => nav('/')} aria-label="CrewPulse home">
          <Logo />
        </button>
        <button className="mission-card" onClick={() => nav('/app/timeline')}>
          <small>ACTIVE MISSION</small>
          <div className="mission-id">
            {MISSION.id} <Icon name="arrowUpRight" size={13} className="ext" />
          </div>
          <div className="mission-sub">
            {MISSION.phase} · Day {MISSION.day}
          </div>
          <div className="mission-prog">
            <span>Mission progress</span>
            <b>{MISSION.progress}%</b>
          </div>
          <div className="bar">
            <i style={{ width: `${MISSION.progress}%` }} />
          </div>
        </button>
        <nav onClick={onClose}>
          {NAV.map((g) => (
            <div className="nav-group" key={g.group}>
              <div className="nav-title">{g.group}</div>
              {g.items.map((it) => (
                <NavLink key={it.to} to={it.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Icon name={it.icon} size={15} />
                  {it.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <button className="sys-card" onClick={() => nav('/app/earthlink')}>
          <span className="sys-top">
            <span className={`dot ${linkOnline ? 'ok' : 'warn'}`} /> {linkOnline ? 'Systems operational' : 'Autonomous mode active'}
          </span>
          <small>{linkOnline ? 'Local simulation active. Ground link available.' : 'Ground link lost. Onboard protocols running.'}</small>
        </button>
      </aside>
    </>
  );
}

const TITLES = Object.fromEntries(NAV.flatMap((g) => g.items.map((i) => [i.to, i.label])));
TITLES['/app/dashboard'] = 'Overview';
TITLES['/app/earthlink'] = 'Offline EarthLink';
TITLES['/app/nervous-system'] = 'Nervous system monitor';
TITLES['/app/journey'] = 'Destination journey';

export default function Shell() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="main">
        <Topbar title={TITLES[pathname] || 'Overview'} onMenu={() => setOpen(true)} />
        <div className="page" key={pathname}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
