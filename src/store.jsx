import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { ALERTS, SHIELD_LAYERS, SOURCES } from './data.js';

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
  const [alerts, setAlerts] = useState(() => load('alerts', ALERTS.map((a) => ({ ...a, state: 'open' }))));
  const [done, setDone] = useState(() => load('done', {}));
  const [layers, setLayers] = useState(() => load('layers', Object.fromEntries(SHIELD_LAYERS.map((l) => [l.id, true]))));
  const [sources, setSources] = useState(() => load('sources', Object.fromEntries(SOURCES.map((s) => [s.id, s.on]))));
  const [thresholds, setThresholds] = useState(() => load('thresholds', { sleep: 6, hrv: 45, stress: 60, readiness: 75 }));
  const [toast, setToast] = useState(null);
  const [crewId, setCrewId] = useState('CM-003');
  const [evidenceId, setEvidenceId] = useState('E-SLEEP');
  const [scenario, setScenario] = useState(null);

  useEffect(() => save('role', role), [role]);
  useEffect(() => save('alerts', alerts), [alerts]);
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
      sources, setSources, thresholds, setThresholds, notify, crewId, setCrewId, evidenceId, setEvidenceId, scenario, setScenario, roleInfo: ROLES[role],
    }),
    [role, linkOnline, alerts, done, layers, sources, thresholds, notify, crewId, evidenceId, scenario]
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
