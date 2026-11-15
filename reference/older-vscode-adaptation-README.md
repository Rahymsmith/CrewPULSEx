# CrewPULSE X | VS Code package

This is a **local-development adaptation** assembled from the latest CrewPULSE X AppDeploy source snapshot inspected in this conversation (snapshot `1794316053606`, app `crewpulse-mission-intelligence-myywq5`).

It preserves the 20-screen CrewPULSE X concept, visual direction, sample crew scenarios, transparent heuristic, evidence panel, mitigation simulator, Three.js orbital Earth, JSON report export, and AI-narrative workflow. AppDeploy-specific imports were replaced with a local Vite + Express setup so the project can be opened in VS Code.

## Important provenance and limitations

- This is not a byte-for-byte AppDeploy export. AppDeploy exposed the stored source files individually and did not expose a direct ZIP export action.
- The local app uses synthetic crew profiles and illustrative mission values.
- The score is a demonstration heuristic, not a calibrated probability or validated readiness prediction.
- The local API returns a transparent scenario narrative. It is **not** a connected LLM by default. No external model credentials are included.
- The role selector changes the UI perspective only. It is not authentication or authorization.
- No NASA telemetry, wearable sensors, clinical records, or mission-control systems are connected.
- The evidence list retains the titles and details visible in the AppDeploy snapshot. Two entries had no URL in that snapshot, so no URL has been invented.
- This prototype is not NASA-endorsed, clinically validated, flight-qualified, or suitable for operational medical/mission decisions.

## Requirements

- Node.js 20 or newer (Node 22 LTS recommended)
- npm
- VS Code

## Run locally

1. Extract the ZIP.
2. Open the `crewpulse-x-vscode` folder in VS Code.
3. In the integrated terminal:

   ```bash
   npm install
   ```

4. Start the frontend and local API together:

   ```bash
   npm run dev:all
   ```

5. Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

Alternative terminals:

```bash
npm run server
npm run dev
```

Run these in two separate terminals.

## Checks

```bash
npm run typecheck
npm run build
```

With the API server running, in another terminal:

```bash
npm run test:smoke
```

These commands are included but have **not been executed in this packaging environment**. Run them on your machine after `npm install`.

## Project layout

```text
crewpulse-x-vscode/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── server/
│   └── index.ts
├── tests/
│   ├── smoke.mjs
│   └── tests.json
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .env.example
└── README.md
```

## API

- `GET /api/health`
- `POST /api/risk/forecast`

The forecast endpoint validates the request with Zod and returns a local, non-diagnostic narrative. It is deliberately explicit about synthetic inputs and limitations.

## Next engineering steps before any real-world evaluation

1. Add real authentication and server-side role/crew authorization.
2. Define a governed telemetry schema with source, timestamp, unit, quality, consent, retention, and provenance fields.
3. Replace the demonstration score only after a documented validation/calibration study.
4. Build evidence retrieval with stable NASA/NTRS/peer-reviewed identifiers and traceable claims.
5. Add audit logging, privacy/security review, tests, deployment pipeline, and a qualified human-factors/clinical governance process.
