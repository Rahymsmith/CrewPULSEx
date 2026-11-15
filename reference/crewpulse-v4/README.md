# CrewPulse — Healthy Crew. Successful Missions.
NASA Space Apps Challenge 2026 · Crew Health Challenge. React 18 + Vite, no other runtime dependencies
(hash router, charts and 3D visuals are built in). All data is simulated.

## Run
    npm install
    npm run dev        # http://localhost:5173
    npm run build      # production build in dist/

No install? Open `preview/index.html` directly in a browser.

## Routes (hash based)
/ landing · /problem · /login (role select) · /app/dashboard · profile · vitals · behavioral · sleep ·
prediction · breakdown · evidence · alerts · actions · simulator · shield · earthlink ·
mission-control · timeline · reports · settings

Landing "Explore the platform" opens /app/dashboard.

## Backend (server/)
`cd server && cp .env.example .env && npm install && npm start` (API on :8787), then `node simulate.js` to stream readings.
Logins (password `crewpulse`): astronaut@, surgeon@, control@crewpulse.dev. Set `ANTHROPIC_API_KEY` for Claude explanations; without it the assistant uses rule-based summaries.
Endpoints: POST /api/auth/login, GET /api/crew, GET /api/risk/:id, POST /api/vitals (x-device-key), GET /api/alerts, POST /api/alerts/:id/ack, GET /api/audit, POST /api/ai/explain, POST /api/ai/chat.
