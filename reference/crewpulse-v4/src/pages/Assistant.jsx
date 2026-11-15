import React, { useState } from 'react';
import { api, getToken, setToken } from '../api.js';

const box = { background: 'rgba(20,32,64,.6)', border: '1px solid rgba(110,160,255,.2)', borderRadius: 12, padding: 16 };
const inp = { background: '#0c1530', color: '#fff', border: '1px solid rgba(110,160,255,.3)', borderRadius: 8, padding: '10px 12px' };

export default function Assistant() {
  const [authed, setAuthed] = useState(!!getToken());
  const [email, setEmail] = useState('surgeon@crewpulse.dev');
  const [pw, setPw] = useState('crewpulse');
  const [q, setQ] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const connect = async (e) => {
    e.preventDefault();
    setErr('');
    try { setToken((await api('/api/auth/login', { email, password: pw })).token); setAuthed(true); }
    catch (x) { setErr(x.message === 'Failed to fetch' ? 'Backend offline. Start it with: cd server && npm start' : x.message); }
  };
  const ask = async (text) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { me: true, text }]); setQ(''); setBusy(true);
    try {
      const r = await api('/api/ai/chat', { message: text });
      setMsgs((m) => [...m, { text: r.text, ai: r.ai }]);
    } catch (x) { if (x.message === 'Unauthorized') { setToken(null); setAuthed(false); } setErr(x.message); }
    setBusy(false);
  };

  if (!authed) return (
    <form onSubmit={connect} style={{ ...box, maxWidth: 420, display: 'grid', gap: 10 }}>
      <h2 style={{ margin: 0 }}>Connect to CrewPulse API</h2>
      <input style={inp} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input style={inp} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" />
      {err && <small style={{ color: '#ff8a8a' }}>{err}</small>}
      <button className="btn blue" type="submit">Sign in</button>
    </form>
  );
  return (
    <div style={{ ...box, display: 'grid', gap: 12, maxWidth: 760 }}>
      <h2 style={{ margin: 0 }}>AI Health Assistant</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['Who is at highest risk right now?', 'Why is risk elevated and what should we do?', 'Draft a handover note for the flight surgeon'].map((s) => (
          <button key={s} className="btn outline" onClick={() => ask(s)}>{s}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 8, maxHeight: 360, overflow: 'auto' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ whiteSpace: 'pre-wrap', padding: 10, borderRadius: 8, background: m.me ? 'rgba(60,110,255,.25)' : 'rgba(255,255,255,.06)' }}>
            {m.text}{m.ai === false && <small style={{ display: 'block', opacity: .6 }}>Rule-based (no AI key set on server)</small>}
          </div>
        ))}
        {busy && <small>Analyzing…</small>}
      </div>
      {err && <small style={{ color: '#ff8a8a' }}>{err}</small>}
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={{ ...inp, flex: 1 }} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask(q)} placeholder="Ask about crew health…" />
        <button className="btn blue" onClick={() => ask(q)}>Ask</button>
      </div>
    </div>
  );
}
