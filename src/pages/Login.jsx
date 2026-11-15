import React, { useState } from 'react';
import { useNavigate } from '../router.jsx';
import Icon from '../components/Icon.jsx';
import { Globe, Logo, Starfield } from '../components/Visuals.jsx';
import { ROLES, useStore } from '../store.jsx';

const ICONS = { astronaut: 'user', surgeon: 'heart', control: 'radar' };

export default function Login() {
  const nav = useNavigate();
  const { role, setRole, notify } = useStore();
  const [sel, setSel] = useState(role);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [busy, setBusy] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setRole(sel);
      notify(mode === 'signup' ? `Demo account created for ${email || 'crew member'}` : `Signed in as ${ROLES[sel].label}`);
      nav(sel === 'control' ? '/app/mission-control' : '/app/dashboard');
    }, 650);
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
        <h1>{mode === 'signup' ? 'Create your crew account' : 'Welcome aboard'}</h1>
        <p className="muted">{mode === 'signup' ? 'Set up a local demo profile to enter the mission workspace.' : 'Sign in to your mission workspace. This is a local simulation — no real credentials are transmitted.'}</p>
        <div className="auth-tabs"><button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Sign in</button><button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Create account</button></div>
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
          <span>Mission email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@mission.demo" type="email" required />
        </label>
        <label className="field"><span>Password</span><input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a demo password" type="password" minLength={6} required /></label>
        <button className="btn green wide" disabled={busy}>
          {busy ? 'Authenticating…' : mode === 'signup' ? 'Create account & continue' : 'Sign in to workspace'} <Icon name="arrowRight" size={14} />
        </button>
        <p className="auth-note">Demo mode only · Credentials are not sent to a server or used for real authentication.</p>
        <button type="button" className="text-link center" onClick={() => nav('/')}>Back to home</button>
      </form>
    </div>
  );
}
