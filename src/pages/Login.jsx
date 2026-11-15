
import React, { useState } from 'react';
import { useNavigate } from '../router.jsx';
import Icon from '../components/Icon.jsx';
import { Globe, Logo, Starfield } from '../components/Visuals.jsx';
import { ROLES, useStore } from '../store.jsx';

const ICONS = { astronaut: 'user', surgeon: 'heart', control: 'radar' };

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8787').replace(/\/$/, '');

const API_ROLES = {
  astronaut: 'Astronaut',
  surgeon: 'Flight surgeon',
  control: 'Mission control'
};

const ROLE_KEYS = {
  'Astronaut': 'astronaut',
  'Flight surgeon': 'surgeon',
  'Mission control': 'control'
};

export default function Login() {
  const nav = useNavigate();
  const { role, setRole, notify } = useStore();

  const [sel, setSel] = useState(role);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const endpoint = mode === 'signup'
        ? '/api/auth/signup'
        : '/api/auth/login';

      const body = mode === 'signup'
        ? {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            role: API_ROLES[sel]
          }
        : {
            email: email.trim().toLowerCase(),
            password
          };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      localStorage.setItem('cpx_token', data.token);
      localStorage.setItem('cpx_user', JSON.stringify(data.user));

      const actualRole = ROLE_KEYS[data.user.role];

      if (!actualRole) {
        throw new Error('The account has an unrecognized mission role.');
      }

      setRole(actualRole);

      notify(mode === 'signup'
        ? 'Crew account created successfully'
        : `Welcome back, ${data.user.name}`);

      nav(actualRole === 'control'
        ? '/app/mission-control'
        : '/app/dashboard');

    } catch (err) {
      setError(err.message || 'Unable to connect to the server.');
    } finally {
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

        <h1>
          {mode === 'signup'
            ? 'Create your crew account'
            : 'Welcome aboard'}
        </h1>

        <p className="muted">
          {mode === 'signup'
            ? 'Create your crew account to enter the mission workspace.'
            : 'Sign in to your CrewPULSEx mission workspace.'}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'signin' ? 'active' : ''}
            onClick={() => {
              setMode('signin');
              setError('');
            }}
          >
            Sign in
          </button>

          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => {
              setMode('signup');
              setError('');
            }}
          >
            Create account
          </button>
        </div>

        {mode === 'signup' && (
          <label className="field">
            <span>Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
            />
          </label>
        )}

        <div className="roles">
          {Object.entries(ROLES).map(([k, r]) => (
            <button
              type="button"
              key={k}
              className={`role ${sel === k ? 'on' : ''}`}
              onClick={() => setSel(k)}
            >
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
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@mission.demo"
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            type="password"
            minLength={mode === 'signup' ? 8 : 1}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
          />
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button className="btn green wide" disabled={busy}>
          {busy
            ? 'Authenticating…'
            : mode === 'signup'
              ? 'Create account & continue'
              : 'Sign in to workspace'}
          <Icon name="arrowRight" size={14} />
        </button>

        <p className="auth-note">
          Secure account authentication · Passwords are stored as salted
          hashes in the CrewPULSEx database.
        </p>

        <button
          type="button"
          className="text-link center"
          onClick={() => nav('/')}
        >
          Back to home
        </button>
      </form>
    </div>
  );
}
