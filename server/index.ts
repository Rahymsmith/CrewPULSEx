import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import crypto from "node:crypto";
import fs from "node:fs";

const app = express();
app.use(cors());
app.use(express.json({ limit: "32kb" }));


// ---------- accounts: sign up, log in, session (scrypt hashes + signed tokens) ----------
const FILE = new URL("./users.json", import.meta.url);
type User = { id: string; name: string; email: string; role: string; salt: string; hash: string; createdAt: string };
const store: { secret: string; users: User[] } = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : { secret: crypto.randomBytes(32).toString("hex"), users: [] };
const persist = () => fs.writeFileSync(FILE, JSON.stringify(store, null, 2));
const SECRET = process.env.AUTH_SECRET || store.secret;
persist();
const hashPw = (pw: string, salt: string) => crypto.scryptSync(pw, salt, 64).toString("hex");
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const sign = (u: User) => { const body = b64({ sub: u.id, exp: Date.now() + 8 * 3600e3 }); return body + "." + crypto.createHmac("sha256", SECRET).update(body).digest("base64url"); };
const userFrom = (req: express.Request): User | null => {
  try {
    const [body, sig] = (req.headers.authorization || "").replace("Bearer ", "").split(".");
    const ok = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
    if (!sig || sig.length !== ok.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(ok))) return null;
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.exp > Date.now() ? store.users.find(u => u.id === p.sub) || null : null;
  } catch { return null; }
};
const pub = (u: User) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt });
const hits = new Map<string, { n: number; t: number }>();
const limit: express.RequestHandler = (req, res, next) => {
  const k = req.ip || "x", now = Date.now(), h = hits.get(k);
  if (!h || now - h.t > 60_000) hits.set(k, { n: 1, t: now });
  else if (++h.n > 10) return res.status(429).json({ error: "Too many attempts. Try again in a minute." });
  next();
};
const Signup = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email().max(120), password: z.string().min(8).max(128), role: z.enum(["Astronaut", "Flight surgeon", "Mission control"]) });
app.post("/api/auth/signup", limit, (req, res) => {
  const p = Signup.safeParse(req.body ?? {});
  if (!p.success) return res.status(400).json({ error: "Enter a name, a valid email and a password of at least 8 characters." });
  if (store.users.some(u => u.email === p.data.email)) return res.status(409).json({ error: "An account with this email already exists." });
  const salt = crypto.randomBytes(16).toString("hex");
  const u: User = { id: crypto.randomUUID(), name: p.data.name, email: p.data.email, role: p.data.role, salt, hash: hashPw(p.data.password, salt), createdAt: new Date().toISOString() };
  store.users.push(u); persist();
  res.status(201).json({ token: sign(u), user: pub(u) });
});
app.post("/api/auth/login", limit, (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase(), pw = String(req.body?.password || "");
  const u = store.users.find(x => x.email === email);
  const ok = u && crypto.timingSafeEqual(Buffer.from(hashPw(pw, u.salt)), Buffer.from(u.hash));
  if (!u || !ok) return res.status(401).json({ error: "Incorrect email or password." });
  res.json({ token: sign(u), user: pub(u) });
});
app.get("/api/auth/me", (req, res) => { const u = userFrom(req); u ? res.json({ user: pub(u) }) : res.status(401).json({ error: "Not signed in." }); });
app.patch("/api/auth/me", (req, res) => {
  const u = userFrom(req); if (!u) return res.status(401).json({ error: "Not signed in." });
  const n = z.string().trim().min(2).max(80).safeParse(req.body?.name);
  if (!n.success) return res.status(400).json({ error: "Name must be 2-80 characters." });
  u.name = n.data; persist(); res.json({ user: pub(u) });
});

const Forecast = z.object({
  member: z.string().max(100).optional(),
  missionPhase: z.string().max(120).optional(),
  sleepHours: z.number().min(0).max(24),
  workload: z.number().min(0).max(10),
  fatigue: z.number().min(0).max(10),
  stress: z.number().min(0).max(100),
  cohesion: z.number().min(0).max(100),
  heuristicScore: z.number().min(0).max(100)
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "operational",
    product: "CrewPULSE X",
    mode: "local research-informed decision-support prototype",
    generatedAt: new Date().toISOString()
  });
});

app.post("/api/risk/forecast", async (req, res) => {
  const parsed = Forecast.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Valid scenario metrics are required.", issues: parsed.error.flatten() });
  }
  const x = parsed.data;
  const factors = [
    x.sleepHours < 6 ? "Sleep opportunity is below the illustrative six-hour watch point." : "Sleep opportunity is not below the illustrative six-hour watch point.",
    x.workload >= 8 ? "Workload is elevated on the demonstration scale." : "Workload is not at the upper end of the demonstration scale.",
    x.fatigue >= 7 ? "Fatigue input is elevated in this scenario." : "Fatigue input is not at the upper end of the demonstration scale.",
    x.stress >= 65 ? "The self-report stress pulse is elevated." : "The stress pulse is below the illustrative watch level.",
    x.cohesion < 60 ? "The cohesion pulse is comparatively low and may merit context." : "The cohesion pulse is not low in this synthetic example."
  ];
  const narrative = [
    `Scenario summary: ${x.member || "Synthetic crew profile"} during ${x.missionPhase || "an unspecified mission phase"}.`,
    `The transparent heuristic indicator is ${x.heuristicScore}/100. It is not a probability, diagnosis, or validated readiness estimate.`,
    "",
    "Contributing context:",
    ...factors.map(f => `• ${f}`),
    "",
    "Options for qualified human review:",
    "• Review task sequencing and recovery opportunity against the mission timeline.",
    "• Consider a voluntary, appropriately governed crew check-in and examine the underlying signal quality.",
    "",
    "Limitations: This output is generated from synthetic demonstration inputs. It is not grounded in a live NASA feed, clinical record, validated prediction model, or evidence-retrieval system. It must not be used to make flight, medical, or personnel decisions."
  ].join("\n");

  // Optional LLM integration is deliberately not silently assumed. Configure a provider and
  // implement its documented request contract before enabling external inference.
  res.json({
    text: narrative,
    generatedAt: new Date().toISOString(),
    mode: "local transparent narrative fallback",
    dataStatus: "synthetic demonstration inputs"
  });
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log(`CrewPULSE X API listening on http://localhost:${port}`));