import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';

const PORT = process.env.PORT || 8787;
const SECRET = process.env.JWT_SECRET || 'dev-secret';
const DEVICE_KEY = process.env.DEVICE_KEY || 'dev-device-key';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const DB_FILE = new URL('./db.json', import.meta.url);

// ---- persistence (JSON file; swap for Postgres/Supabase in production) ----
const seed = () => ({
  users: [
    { email: 'astronaut@crewpulse.dev', role: 'astronaut', crewId: 'CM-001', hash: bcrypt.hashSync('crewpulse', 8) },
    { email: 'surgeon@crewpulse.dev', role: 'surgeon', hash: bcrypt.hashSync('crewpulse', 8) },
    { email: 'control@crewpulse.dev', role: 'control', hash: bcrypt.hashSync('crewpulse', 8) },
  ],
  crew: [
    ['CM-001', 'Alex Morgan', 'Commander', 61, 7.5, 70, 22], ['CM-002', 'Maya Chen', 'Flight Engineer', 64, 7.2, 64, 41],
    ['CM-003', 'James Leo', 'Mission Specialist', 66, 7.0, 60, 63], ['CM-004', 'Elena Rossi', 'Medical Officer', 60, 7.3, 71, 25],
    ['CM-005', 'Omar Haddad', 'Pilot', 62, 7.2, 67, 24], ['CM-006', 'Priya Nair', 'Science Officer', 63, 7.1, 65, 30],
  ].map(([id, name, role, hr, sleepH, hrv, stress]) => ({ id, name, role, baseline: { hr, sleepH, hrv, stress: 28 }, start: { hr, sleepH, hrv, stress } })),
  vitals: [], alerts: [], audit: [],
});
let db = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE)) : seed();
const save = () => fs.writeFileSync(DB_FILE, JSON.stringify(db));
const log = (user, action, detail) => { db.audit.push({ t: new Date().toISOString(), user, action, detail }); save(); };

// ---- risk engine (server-side, explainable drivers) ----
export function scoreRisk(v, base) {
  const d = [];
  const add = (name, pts, why) => pts > 0 && d.push({ name, points: Math.round(pts), why });
  add('Sleep debt', Math.max(0, (base.sleepH - v.sleepH) * 12), `${v.sleepH}h vs baseline ${base.sleepH}h`);
  add('Stress load', Math.max(0, (v.stress - base.stress) * 0.9), `stress ${v.stress} vs baseline ${base.stress}`);
  add('Heart rate drift', Math.max(0, (v.hr - base.hr) * 1.1), `${v.hr} bpm vs baseline ${base.hr}`);
  add('Low SpO2', Math.max(0, (96 - v.spo2) * 8), `SpO2 ${v.spo2}%`);
  const score = Math.min(100, d.reduce((s, x) => s + x.points, 0));
  return { score, level: score >= 60 ? 'Critical' : score >= 35 ? 'Warning' : 'Normal', drivers: d.sort((a, b) => b.points - a.points) };
}
const latest = (id) => [...db.vitals].reverse().find((x) => x.crewId === id);
const riskFor = (id) => { const c = db.crew.find((x) => x.id === id); const v = latest(id); return c && v ? { crewId: id, name: c.name, vitals: v, ...scoreRisk(v, c.baseline) } : null; };

// ---- auth ----
const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));
const auth = (roles) => (req, res, next) => {
  try {
    req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET);
    if (roles && !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden for role' });
    next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
};
const visible = (u) => (u.role === 'astronaut' ? db.crew.filter((c) => c.id === u.crewId) : db.crew);

app.post('/api/auth/login', (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const u = db.users.find((x) => x.email === email.toLowerCase());
  if (!u || !bcrypt.compareSync(password, u.hash)) return res.status(401).json({ error: 'Invalid credentials' });
  log(u.email, 'login');
  res.json({ token: jwt.sign({ email: u.email, role: u.role, crewId: u.crewId }, SECRET, { expiresIn: '8h' }), role: u.role, crewId: u.crewId });
});

const STATUS = { Normal: 'Nominal', Warning: 'Monitor', Critical: 'Elevate' };
app.get('/api/crew', auth(), (req, res) => res.json(visible(req.user).map((c) => {
  const r = riskFor(c.id); if (!r) return { id: c.id, name: c.name, role: c.role };
  const v = r.vitals;
  return { id: c.id, name: c.name, role: c.role, hr: v.hr, hrv: v.hrv, spo2: v.spo2, stress: v.stress, sleep: v.sleepH, readiness: Math.round(100 - r.score * 0.6), status: STATUS[r.level], risk: r.score, drivers: r.drivers };
})));
app.get('/api/risk/:id', auth(), (req, res) => {
  if (!visible(req.user).some((c) => c.id === req.params.id)) return res.status(403).json({ error: 'Not your crew data' });
  res.json(riskFor(req.params.id) || { error: 'No vitals yet' });
});

// ---- ingestion (wearables / simulators post here with a device key) ----
app.post('/api/vitals', (req, res) => {
  if (req.headers['x-device-key'] !== DEVICE_KEY) return res.status(401).json({ error: 'Bad device key' });
  const { crewId, hr, sleepH, stress, spo2, hrv } = req.body || {};
  const c = db.crew.find((x) => x.id === crewId);
  if (!c || [hr, sleepH, stress, spo2].some((n) => typeof n !== 'number')) return res.status(400).json({ error: 'Invalid payload' });
  const v = { crewId, hr, sleepH, stress, spo2, hrv: typeof hrv === 'number' ? hrv : c.baseline.hrv, t: new Date().toISOString() };
  const r = pushVitals(c, v);
  save(); res.status(201).json({ ok: true, ...r });
});

const META = { 'Sleep debt': ['Sleep & circadian', 'Review rest schedule and workload.', 'E-SLEEP'], 'Stress load': ['Behavioral health', 'Schedule a psychological check-in.', 'E-BHP'], 'Heart rate drift': ['Physiological', 'Schedule a medical office visit.', 'E-HSRB'], 'Low SpO2': ['Physiological', 'Check cabin air and sensor fit.', 'E-HSRB'] };
function pushVitals(c, v) {
  db.vitals.push(v); db.vitals = db.vitals.slice(-5000);
  const r = scoreRisk(v, c.baseline);
  const top = r.drivers[0];
  const open = db.alerts.find((a) => a.crewId === c.id && a.state === 'open' && a.title === top?.name);
  if (r.level !== 'Normal' && top && !open) {
    const [category, next, evidence] = META[top.name];
    db.alerts.push({ id: 'A' + Date.now() + c.id.slice(-1), crewId: c.id, severity: r.level, title: top.name, detail: top.why, category, next, evidence, score: r.score, state: 'open', t: v.t });
  }
  return r;
}
// built-in live feed so the system runs without external sensors (set SIMULATE=false to rely on real devices)
if (process.env.SIMULATE !== 'false') setInterval(() => {
  db.crew.forEach((c) => {
    const p = latest(c.id) || { ...c.start, sleepH: c.start.sleepH, spo2: 98 };
    const j = (x, a, lo, hi) => Math.min(hi, Math.max(lo, +(x + (Math.random() - 0.5) * a).toFixed(1)));
    pushVitals(c, { crewId: c.id, hr: j(p.hr, 3, 50, 110), hrv: j(p.hrv ?? c.start.hrv, 4, 20, 90), spo2: j(p.spo2, 0.8, 90, 100), stress: j(p.stress, 6, 5, 95), sleepH: j(p.sleepH, 0.3, 3, 9), t: new Date().toISOString() });
  });
  save();
}, 4000);

// ---- shared alerts + audit ----
const ago = (t) => { const m = Math.max(1, Math.round((Date.now() - new Date(t)) / 60000)); return m < 60 ? m + 'm ago' : Math.round(m / 60) + 'h ago'; };
app.get('/api/alerts', auth(), (req, res) => res.json(db.alerts.filter((a) => visible(req.user).some((c) => c.id === a.crewId)).slice(-50).reverse().map((a) => ({ ...a, crew: a.crewId, severity: a.severity === 'Critical' ? 'High' : 'Moderate', time: ago(a.t) }))));
app.post('/api/alerts/:id/state', auth(['surgeon', 'control']), (req, res) => {
  const a = db.alerts.find((x) => x.id === req.params.id);
  if (!a || !['open', 'acknowledged', 'escalated', 'resolved'].includes(req.body?.state)) return res.status(400).json({ error: 'Bad request' });
  a.state = req.body.state; a.by = req.user.email; log(req.user.email, 'alert_' + a.state, a.id); res.json(a);
});
app.post('/api/alerts/:id/ack', auth(['surgeon', 'control']), (req, res) => {
  const a = db.alerts.find((x) => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  a.state = 'acknowledged'; a.by = req.user.email; log(req.user.email, 'ack_alert', a.id); res.json(a);
});
app.get('/api/audit', auth(['control']), (req, res) => res.json(db.audit.slice(-200).reverse()));

// ---- AI: Claude-powered explanations + assistant (rule-based fallback without a key) ----
async function claude(system, user) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 500, system, messages: [{ role: 'user', content: user }] }),
  });
  if (!r.ok) throw new Error('Anthropic ' + r.status);
  return (await r.json()).content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}
const SYS = 'You are CrewPulse, a crew-health decision-support assistant for spaceflight. Use only the supplied data. Be concise, cite the driver numbers, give 2-3 countermeasures aligned with NASA HRP risks (sleep/circadian, workload, team, behavioral health). You support, not replace, the flight surgeon. Never invent readings.';
const fallback = (r) => `${r.name}: risk ${r.score}/100 (${r.level}). Top drivers: ${r.drivers.slice(0, 3).map((d) => `${d.name} (${d.why})`).join('; ') || 'none'}. Suggested: protect a full sleep block, rebalance workload, schedule a check-in with the flight surgeon. (AI key not configured; rule-based summary.)`;

app.post('/api/ai/explain', auth(), async (req, res) => {
  const id = req.body?.crewId || req.user.crewId;
  if (!visible(req.user).some((c) => c.id === id)) return res.status(403).json({ error: 'Not your crew data' });
  const r = riskFor(id); if (!r) return res.status(404).json({ error: 'No vitals yet' });
  try { res.json({ text: (await claude(SYS, JSON.stringify(r))) || fallback(r), ai: !!process.env.ANTHROPIC_API_KEY }); }
  catch { res.json({ text: fallback(r), ai: false }); }
});
app.post('/api/ai/chat', auth(), async (req, res) => {
  const q = String(req.body?.message || '').slice(0, 1000);
  const ctx = visible(req.user).map((c) => riskFor(c.id)).filter(Boolean);
  try {
    const t = await claude(SYS, `Crew data: ${JSON.stringify(ctx)}\nQuestion: ${q}`);
    res.json({ text: t || (ctx.map(fallback).join('\n') || 'No vitals ingested yet.'), ai: !!t });
  } catch { res.json({ text: ctx.map(fallback).join('\n'), ai: false }); }
});

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log('CrewPulse API on :' + PORT));
