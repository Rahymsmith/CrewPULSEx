import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { ALERTS, CREW, SHIELD_LAYERS, SOURCES } from './data.js';
import { api, getToken } from './api.js';

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

const load = (k, d) => {
  try {
    const v = localStorage.getItem('crewpulse:' + k);
    return v ? JSON.parse(v) : d;
  } catch {
    return d;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem('crewpulse:' + k, JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
};

export const ROLES = {
  astronaut: { label: 'Astronaut', user: 'Alex Morgan', tag: 'Crew', desc: 'See your own health, sleep and recommended countermeasures.' },
  surgeon: { label: 'Flight Surgeon', user: 'Dr. Bilaal', tag: 'Medical', desc: 'Review crew risk, evidence and escalate actions.' },
  control: { label: 'Mission Control', user: 'Bilaal', tag: 'Agent', desc: 'Ground-side view of all crews, timelines and mission impact.' },
};

export function StoreProvider({ children }) {
  const [role, setRole] = useState(() => load('role', 'control'));
  const [linkOnline, setLinkOnline] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [done, setDone] = useState(() => load('done', {}));
  const [layers, setLayers] = useState(() => load('layers', Object.fromEntries(SHIELD_LAYERS.map((l) => [l.id, true]))));
  const [sources, setSources] = useState(() => load('sources', Object.fromEntries(SOURCES.map((s) => [s.id, s.on]))));
  const [thresholds, setThresholds] = useState(() => load('thresholds', { sleep: 6, hrv: 45, stress: 60, readiness: 75 }));
  const [toast, setToast] = useState(null);
  const [live, setLive] = useState(false);
  const [tick, setTick] = useState(0);
  const [crewId, setCrewId] = useState('CM-003');
  const [evidenceId, setEvidenceId] = useState('E-SLEEP');
  const [scenario, setScenario] = useState(null);

  // live sync with the backend: crew vitals + shared alerts
  const prev = React.useRef({});
  useEffect(() => {
    if (!getToken()) return undefined;
    let stop = false;
    const pull = async () => {
      try {
        const [crew, al] = await Promise.all([api('/api/crew'), api('/api/alerts')]);
        if (stop) return;
        crew.forEach((c) => { const m = CREW.find((x) => x.id === c.id); if (m && c.hr != null) Object.assign(m, c); });
        prev.current = Object.fromEntries(al.map((a) => [a.id, a.state]));
        setAlerts(al); setLive(true); setTick((t) => t + 1);
      } catch (e) { if (!stop) setLive(false); if (e.message === 'Unauthorized') localStorage.removeItem('cp_token'); }
    };
    pull(); const i = setInterval(pull, 4000);
    return () => { stop = true; clearInterval(i); };
  }, [role]);
  useEffect(() => {
    if (!live) return;
    alerts.forEach((a) => { if (prev.current[a.id] && prev.current[a.id] !== a.state) { prev.current[a.id] = a.state; api('/api/alerts/' + a.id + '/state', { state: a.state }).catch(() => {}); } });
  }, [alerts, live]);
  useEffect(() => save('role', role), [role]);
  useEffect(() => save('done', done), [done]);
  useEffect(() => save('layers', layers), [layers]);
  useEffect(() => save('sources', sources), [sources]);
  useEffect(() => save('thresholds', thresholds), [thresholds]);

  const notify = useCallback((msg) => {
    setToast({ msg, k: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const value = useMemo(
    () => ({
      role, setRole, linkOnline, setLinkOnline, alerts, setAlerts, done, setDone, layers, setLayers,
      sources, setSources, thresholds, setThresholds, notify, live, tick, crewId, setCrewId, evidenceId, setEvidenceId, scenario, setScenario, roleInfo: ROLES[role],
    }),
    [role, live, tick, linkOnline, alerts, done, layers, sources, thresholds, notify, crewId, evidenceId, scenario]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {toast && (
        <div className="toast" key={toast.k} role="status">
          <span className="dot ok" /> {toast.msg}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function download(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
