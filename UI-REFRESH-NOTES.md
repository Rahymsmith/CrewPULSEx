# CrewPULSEx UI Refresh

This archive is a visual redesign of the supplied `crewpulse.zip` project.

## What changed
- Refined the visual system to a modern mission-operations aesthetic: deep navy surfaces, restrained blue/teal accents, softer borders, and clearer typography.
- Updated the application shell, sidebar navigation, mission card, top bar, cards, dashboard hero, KPI tiles, charts, tables, buttons, and status surfaces.
- Refreshed the landing page, feature cards, and role-selection/login screen.
- Improved mobile and tablet layouts and added reduced-motion support.
- Kept the existing React components, routes, app data, and interaction logic intact. The changes are applied as a CSS override layer to reduce regression risk.

## Run locally
From the extracted `crewpulse` project folder:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Notes
This is a UI refresh of the uploaded source project, not a production deployment. Existing simulated data and prototype limitations remain unchanged.


## November update: authentication and mission visuals
- Restored a clear sign-in / create-account switch on the existing login route. This remains local demo-mode UI; no backend authentication or credential storage is implemented.
- Added a Nervous system monitor with an illustrative central/peripheral neural pathway diagram and synthetic crew indicators. It is not a diagnostic or medical sensor display.
- Added a Destination journey page with Earth-to-Moon trajectory art and an interactive mission-progress slider. It is illustrative, not live flight navigation.
- New routes: `/app/nervous-system` and `/app/journey`.
