
 import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import crypto from "node:crypto";
import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
const AUTH_SECRET = process.env.AUTH_SECRET;

if (!DATABASE_URL || !AUTH_SECRET) {
  throw new Error("DATABASE_URL and AUTH_SECRET must be configured.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 20000,
  ssl: { rejectUnauthorized: false }
});

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://crew-puls-ex.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origin not allowed by CORS"));
    }
  }
}));

app.use(express.json({ limit: "32kb" }));

// ---------- Database user helpers ----------

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  salt: string;
  password_hash: string;
  created_at: Date;
};

const publicUser = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.created_at
});

async function findByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    "SELECT * FROM public.crew_users WHERE email = $1 LIMIT 1",
    [email]
  );
  return result.rows[0] || null;
}

async function findById(id: string): Promise<User | null> {
  const result = await pool.query(
    "SELECT * FROM public.crew_users WHERE id = $1 LIMIT 1",
    [id]
  );
  return result.rows[0] || null;
}

// ---------- Password and token security ----------

const hashPassword = (password: string, salt: string) =>
  crypto.scryptSync(password, salt, 64).toString("hex");

const createToken = (user: User) => {
  const body = Buffer.from(JSON.stringify({
    sub: user.id,
    exp: Date.now() + 8 * 60 * 60 * 1000
  })).toString("base64url");

  const signature = crypto
    .createHmac("sha256", AUTH_SECRET!)
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
};

async function authenticatedUser(
  req: express.Request
): Promise<User | null> {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return null;

    const token = header.slice(7);
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [body, signature] = parts;

    const expected = crypto
      .createHmac("sha256", AUTH_SECRET!)
      .update(body)
      .digest("base64url");

    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    );

    if (typeof payload.exp !== "number" || payload.exp <= Date.now()) {
      return null;
    }

    return await findById(payload.sub);
  } catch {
    return null;
  }
}

// ---------- Authentication rate limit ----------

const hits = new Map<string, { n: number; t: number }>();

const limit: express.RequestHandler = (req, res, next) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now - entry.t > 60000) {
    hits.set(key, { n: 1, t: now });
  } else {
    entry.n++;
    if (entry.n > 10) {
      return res.status(429).json({
        error: "Too many attempts. Try again in a minute."
      });
    }
  }

  next();
};

// ---------- Signup ----------

const Signup = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(8).max(128),
  role: z.enum([
    "Astronaut",
    "Flight surgeon",
    "Mission control"
  ])
});

app.post("/api/auth/signup", limit, async (req, res) => {
  const parsed = Signup.safeParse(req.body ?? {});

  if (!parsed.success) {
    return res.status(400).json({
      error: "Enter a name, valid email and password of at least 8 characters."
    });
  }

  try {
    const { name, email, password, role } = parsed.data;

    const existing = await findByEmail(email);

    if (existing) {
      return res.status(409).json({
        error: "An account with this email already exists."
      });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);
    const id = crypto.randomUUID();

    const result = await pool.query(
      `INSERT INTO public.crew_users
       (id, name, email, role, salt, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, name, email, role, salt, passwordHash]
    );

    const user: User = result.rows[0];

    return res.status(201).json({
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error: any) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "An account with this email already exists."
      });
    }

    console.error("Signup error:", error.message);

    return res.status(500).json({
      error: "Unable to create account."
    });
  }
});

// ---------- Login ----------

app.post("/api/auth/login", limit, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password || password.length > 128) {
      return res.status(400).json({
        error: "Email and password are required."
      });
    }

    const user = await findByEmail(email);

    if (!user) {
      return res.status(401).json({
        error: "Incorrect email or password."
      });
    }

    const calculated = Buffer.from(
      hashPassword(password, user.salt),
      "hex"
    );

    const stored = Buffer.from(user.password_hash, "hex");

    if (
      calculated.length !== stored.length ||
      !crypto.timingSafeEqual(calculated, stored)
    ) {
      return res.status(401).json({
        error: "Incorrect email or password."
      });
    }

    return res.json({
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error: any) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      error: "Unable to log in."
    });
  }
});

// ---------- Current user ----------

app.get("/api/auth/me", async (req, res) => {
  const user = await authenticatedUser(req);

  if (!user) {
    return res.status(401).json({
      error: "Not signed in."
    });
  }

  return res.json({ user: publicUser(user) });
});

app.patch("/api/auth/me", async (req, res) => {
  const user = await authenticatedUser(req);

  if (!user) {
    return res.status(401).json({
      error: "Not signed in."
    });
  }

  const parsed = z.string()
    .trim()
    .min(2)
    .max(80)
    .safeParse(req.body?.name);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Name must be 2-80 characters."
    });
  }

  try {
    const result = await pool.query(
      `UPDATE public.crew_users
       SET name = $1
       WHERE id = $2
       RETURNING *`,
      [parsed.data, user.id]
    );

    return res.json({
      user: publicUser(result.rows[0])
    });
  } catch (error: any) {
    console.error("Profile update error:", error.message);

    return res.status(500).json({
      error: "Unable to update profile."
    });
  }
});

// ---------- Crew member API ----------

const CrewMemberInput = z.object({
  name: z.string().trim().min(2).max(100),
  crew_role: z.string().trim().min(2).max(80),
  mission_assignment: z.string().trim().max(150).nullable().optional(),
  age: z.number().int().min(18).max(100).nullable().optional(),
  status: z.string().trim().min(2).max(50).optional()
});

app.get("/api/crew", async (req, res) => {
  const user = await authenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Not signed in." });

  try {
    const result = await pool.query(
      `SELECT id, name, crew_role, mission_assignment, age, status, created_at, updated_at
       FROM public.crew_members
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    );
    return res.json({ crew: result.rows });
  } catch (error: any) {
    console.error("Crew retrieval error:", error.message);
    return res.status(500).json({ error: "Unable to retrieve crew members." });
  }
});

app.post("/api/crew", async (req, res) => {
  const user = await authenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Not signed in." });

  const parsed = CrewMemberInput.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Enter a valid name and crew role." });
  }

  try {
    const { name, crew_role, mission_assignment, age, status } = parsed.data;
    const result = await pool.query(
      `INSERT INTO public.crew_members
       (owner_id, name, crew_role, mission_assignment, age, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, crew_role, mission_assignment, age, status, created_at, updated_at`,
      [user.id, name, crew_role, mission_assignment ?? null, age ?? null, status ?? "Unknown"]
    );
    return res.status(201).json({ crew: result.rows[0] });
  } catch (error: any) {
    console.error("Crew creation error:", error.message);
    return res.status(500).json({ error: "Unable to add crew member." });
  }
});

// ---------- Health check ----------

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT NOW()");

    return res.json({
      status: "operational",
      database: "connected",
      product: "CrewPULSE X",
      mode: "Supabase PostgreSQL",
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Health check failed:", error.message);

    return res.status(503).json({
      status: "degraded",
      database: "disconnected",
      product: "CrewPULSE X"
    });
  }
});

// ---------- Risk forecast ----------

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

app.post("/api/risk/forecast", async (req, res) => {
  const parsed = Forecast.safeParse(req.body ?? {});

  if (!parsed.success) {
    return res.status(400).json({
      error: "Valid scenario metrics are required.",
      issues: parsed.error.flatten()
    });
  }

  const x = parsed.data;

  const factors = [
    x.sleepHours < 6
      ? "Sleep opportunity is below the illustrative six-hour watch point."
      : "Sleep opportunity is not below the illustrative six-hour watch point.",
    x.workload >= 8
      ? "Workload is elevated on the demonstration scale."
      : "Workload is not at the upper end of the demonstration scale.",
    x.fatigue >= 7
      ? "Fatigue input is elevated in this scenario."
      : "Fatigue input is not at the upper end of the demonstration scale.",
    x.stress >= 65
      ? "The self-report stress pulse is elevated."
      : "The stress pulse is below the illustrative watch level.",
    x.cohesion < 60
      ? "The cohesion pulse is comparatively low and may merit context."
      : "The cohesion pulse is not low in this synthetic example."
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

  return res.json({
    text: narrative,
    generatedAt: new Date().toISOString(),
    mode: "local transparent narrative fallback",
    dataStatus: "synthetic demonstration inputs"
  });
});

// ---------- Start server ----------

const port = Number(process.env.PORT || 8787);

async function startServer() {
  try {
    await pool.query("SELECT NOW()");
    console.log("Supabase PostgreSQL connected successfully.");

    app.listen(port, () => {
      console.log(`CrewPULSE X API listening on port ${port}`);
    });
  } catch (error: any) {
    console.error("Supabase connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
