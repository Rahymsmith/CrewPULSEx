import React, { useState } from 'react';
import { useNavigate } from '../router.jsx';
import Icon from '../components/Icon.jsx';
import { Globe, Logo, Starfield } from '../components/Visuals.jsx';
import { roleHome } from '../data.js';
import { api, setToken } from '../api.js';
import { ROLES, useStore } from '../store.jsx';

const ICONS = { astronaut: 'user', surgeon: 'heart', control: 'radar' };

export default function Login() {
  const nav = useNavigate();
  const { role, setRole, notify } = useStore();
  const [sel, setSel] = useState(role);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const [pw, setPw] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api('/api/auth/login', { email: email || `${sel}@crewpulse.dev`, password: pw });
      setToken(r.token); setRole(r.role);
      notify(`Signed in as ${ROLES[r.role].label}`);
      nav(roleHome(r.role));
    } catch (x) {
      notify(x.message === 'Failed to fetch' ? 'Backend offline: run cd server && npm start' : x.message);
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <Starfield density={130} />
      <div className="login-globe">
        <Globe size={520} />
      </div>
      <form className="login-card" onSubmit={submit}>
        <button type="button" className="logo-btn" onClick={() => nav('/')}>
          <Logo size={32} />
        </button>
        <h1>Welcome aboard</h1>
        <p className="muted">Choose your role to personalise the workspace. This is a simulation environment — no real credentials are used.</p>
        <div className="roles">
          {Object.entries(ROLES).map(([k, r]) => (
            <button type="button" key={k} className={`role ${sel === k ? 'on' : ''}`} onClick={() => setSel(k)}>
              <span className="role-ico">
                <Icon name={ICONS[k]} size={20} />
              </span>
              <span>
                <b>{r.label}</b>
                <small>{r.desc}</small>
              </span>
              <i className="radio" />
            </button>
          ))}
        </div>
        <label className="field">
          <span>Mission email (blank = role account)</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@mission.nasa.demo" type="email" />
        </label>
        <label className="field">
          <span>Password</span>
          <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" type="password" required />
        </label>
        <button className="btn green wide" disabled={busy}>
          {busy ? 'Authenticating…' : 'Continue to workspace'} <Icon name="arrowRight" size={14} />
        </button>
        <button type="button" className="text-link center" onClick={() => nav(roleHome(role))}>
          Continue as {ROLES[role].label}
        </button>
      </form>
    </div>
  );
}
