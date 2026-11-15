// All values are simulated demo data — no real astronaut data is used.

export const MISSION = { id: 'ARES-07', phase: 'Lunar transit', day: 142, totalDays: 209, progress: 68 };

export const CREW = [
  { id: 'CM-001', name: 'Alex Morgan', role: 'Commander', age: 41, readiness: 94, status: 'Nominal', hr: 62, hrv: 68, spo2: 98, temp: 36.6, resp: 14, stress: 22, sleep: 7.4, mood: 82, load: 54, baseHr: 61, baseSleep: 7.5, baseHrv: 70 },
  { id: 'CM-002', name: 'Maya Chen', role: 'Flight Engineer', age: 36, readiness: 81, status: 'Monitor', hr: 68, hrv: 55, spo2: 97, temp: 36.7, resp: 15, stress: 41, sleep: 6.3, mood: 70, load: 71, baseHr: 64, baseSleep: 7.2, baseHrv: 64 },
  { id: 'CM-003', name: 'James Leo', role: 'Mission Specialist', age: 44, readiness: 72, status: 'Elevate', hr: 74, hrv: 41, spo2: 96, temp: 36.9, resp: 17, stress: 63, sleep: 5.2, mood: 55, load: 82, baseHr: 66, baseSleep: 7.0, baseHrv: 60 },
  { id: 'CM-004', name: 'Elena Rossi', role: 'Medical Officer', age: 39, readiness: 91, status: 'Nominal', hr: 60, hrv: 72, spo2: 99, temp: 36.5, resp: 13, stress: 25, sleep: 7.2, mood: 80, load: 58, baseHr: 60, baseSleep: 7.3, baseHrv: 71 },
  { id: 'CM-005', name: 'Omar Haddad', role: 'Pilot', age: 43, readiness: 92, status: 'Nominal', hr: 63, hrv: 66, spo2: 98, temp: 36.6, resp: 14, stress: 24, sleep: 7.1, mood: 79, load: 60, baseHr: 62, baseSleep: 7.2, baseHrv: 67 },
  { id: 'CM-006', name: 'Priya Nair', role: 'Science Officer', age: 35, readiness: 87, status: 'Nominal', hr: 65, hrv: 62, spo2: 98, temp: 36.6, resp: 14, stress: 30, sleep: 6.9, mood: 75, load: 64, baseHr: 63, baseSleep: 7.1, baseHrv: 65 },
];

export const TREND_DAYS = [136, 137, 138, 139, 140, 141, 142];
export const TREND = {
  7: [39, 52, 40, 77, 66, 91, 77],
  14: [58, 61, 55, 49, 63, 70, 66, 39, 52, 40, 77, 66, 91, 77],
  30: [66, 70, 64, 72, 68, 75, 71, 69, 74, 78, 73, 70, 66, 61, 64, 58, 61, 55, 49, 63, 70, 66, 39, 52, 40, 77, 66, 91, 77, 86],
};

export const NAV = [
  { group: 'WORKSPACE', items: [{ to: '/app/dashboard', label: 'Overview Dashboard', icon: 'grid' }] },
  {
    group: 'CREW HEALTH',
    items: [
      { to: '/app/profile', label: 'Crew member profile', icon: 'user' },
      { to: '/app/vitals', label: 'Vital monitor', icon: 'heart' },
      { to: '/app/behavioral', label: 'Behavioural health', icon: 'brain' },
      { to: '/app/sleep', label: 'Sleep & circadian', icon: 'moon' },
    ],
  },
  {
    group: 'INTELLIGENCE',
    items: [
      { to: '/app/prediction', label: 'AI risk prediction', icon: 'spark' },
      { to: '/app/evidence', label: 'Evidence mode', icon: 'book' },
      { to: '/app/assistant', label: 'AI assistant', icon: 'spark' },
      { to: '/app/breakdown', label: 'Risk breakdown', icon: 'layers' },
      { to: '/app/alerts', label: 'Alerts center', icon: 'bell' },
      { to: '/app/actions', label: 'Recommended actions', icon: 'check' },
    ],
  },
  {
    group: 'MISSIONSYNC INTELLIGENCE',
    items: [
      { to: '/app/simulator', label: 'Mission Impact Simulator', icon: 'rocket' },
      { to: '/app/shield', label: 'Crew Shield', icon: 'shield' },
      { to: '/app/earthlink', label: 'Offline Healthlink', icon: 'link' },
    ],
  },
  {
    group: 'OPERATIONS',
    items: [
      { to: '/app/mission-control', label: 'Mission control', icon: 'radar' },
      { to: '/app/timeline', label: 'Mission timeline', icon: 'clock' },
      { to: '/app/reports', label: 'Report & export', icon: 'file' },
      { to: '/app/settings', label: 'Settings & data source', icon: 'gear' },
    ],
  },
];

export const ALERTS = [
  { id: 'A-301', crew: 'CM-003', title: 'Sleep duration below personal baseline', detail: 'Sleep below personal baseline for 2 consecutive cycles.', severity: 'High', category: 'Sleep & circadian', time: '2m ago', next: 'Review rest schedule and workload context.', evidence: 'E-SLEEP' },
  { id: 'A-302', crew: 'CM-003', title: 'HRV suppressed vs. 14-day baseline', detail: 'Heart-rate variability is 31% under baseline while workload is rising.', severity: 'Moderate', category: 'Physiological', time: '18m ago', next: 'Schedule a medical officer check-in.', evidence: 'E-MED' },
  { id: 'A-302b', crew: 'CM-002', title: 'Team communication frequency dropping', detail: 'Cohesion index fell 9 points over 4 days.', severity: 'Moderate', category: 'Team cohesion', time: '1h ago', next: 'Plan a shared meal / team debrief block.', evidence: 'E-TEAM' },
  { id: 'A-290', crew: 'CM-002', title: 'Workload above planned envelope', detail: 'Planned task load exceeded for 3 days in a row.', severity: 'Low', category: 'Workload', time: '3h ago', next: 'Rebalance upcoming EVA prep tasks.', evidence: 'E-SLEEP' },
  { id: 'A-281', crew: 'CM-005', title: 'Link latency increased', detail: 'Ground link round trip trending up; autonomy protocols on standby.', severity: 'Low', category: 'Connectivity', time: '5h ago', next: 'Confirm Offline EarthLink cache is current.', evidence: 'E-BHP' },
];

export const EVIDENCE = [
  {
    id: 'E-BHP',
    risk: 'Behavioral Health & Performance',
    title: 'Risk of Adverse Cognitive or Behavioral Conditions and Psychiatric Disorders',
    org: 'NASA Human Research Program · HSRB',
    year: 'Evidence Report',
    summary: 'Long-duration missions combine isolation, confinement and communication delay. Early detection of mood, sleep and cohesion changes supports timely countermeasures.',
    confidence: 'High',
    url: 'https://humanresearchroadmap.nasa.gov/',
  },
  {
    id: 'E-TEAM',
    risk: 'Team & Psychosocial',
    title: 'Risk of Performance and Behavioral Health Decrements Due to Inadequate Cooperation, Coordination, Communication, and Psychosocial Adaptation Within a Team',
    org: 'NASA Human Research Program',
    year: 'Evidence Report',
    summary: 'Team cohesion and communication patterns are linked with performance. Falling interaction frequency is treated as an early signal for team-level support.',
    confidence: 'High',
    url: 'https://humanresearchroadmap.nasa.gov/',
  },
  {
    id: 'E-SLEEP',
    risk: 'Sleep & Workload',
    title: 'Risk of Performance Decrements and Adverse Health Outcomes Resulting from Sleep Loss, Circadian Desynchronization, and Work Overload',
    org: 'NASA Human Research Program',
    year: 'Evidence Report',
    summary: 'Sleep restriction and circadian misalignment degrade alertness and operational performance. Schedule and workload adjustments are primary countermeasures.',
    confidence: 'High',
    url: 'https://humanresearchroadmap.nasa.gov/',
  },
  {
    id: 'E-MED',
    risk: 'Medical Conditions',
    title: 'Risk of Adverse Health Outcomes and Decrements in Performance Due to Inflight Medical Conditions',
    org: 'NASA Human Research Program · HSRB',
    year: 'Evidence Report',
    summary: 'Inflight medical events shape mission outcomes; autonomous clinical decision support matters when real-time ground consult is limited.',
    confidence: 'Moderate',
    url: 'https://humanresearchroadmap.nasa.gov/',
  },
  {
    id: 'E-STD',
    risk: 'Standards',
    title: 'NASA-STD-3001: Space Flight Human-System Standard (Vol. 1 Crew Health)',
    org: 'NASA Office of the Chief Health & Medical Officer',
    year: 'Standard',
    summary: 'Defines crew health and performance standards that thresholds in CrewPulse are mapped to for review.',
    confidence: 'Moderate',
    url: 'https://www.nasa.gov/',
  },
  {
    id: 'E-HSRB',
    risk: 'HSRB Risk Posture',
    title: 'Human System Risk Board: likelihood and consequence ratings for human spaceflight risks',
    org: 'NASA HSRB',
    year: 'Evidence Report',
    summary: 'The Human System Risk Board rates each human risk by likelihood and consequence for mission design reference missions. CrewPulse alert severity mirrors this likelihood-and-consequence framing so reviewers can trace escalation levels.',
    confidence: 'High',
    url: 'https://humanresearchroadmap.nasa.gov/',
  },
  {
    id: 'E-CIRC',
    risk: 'Circadian & Lighting',
    title: 'Circadian misalignment and light exposure as drivers of sleep loss and fatigue',
    org: 'NASA Human Research Program',
    year: 'Evidence Report',
    summary: 'Timing and intensity of light shifts the body clock. Schedule alignment and tuned cabin lighting are standard countermeasures against fatigue and degraded alertness.',
    confidence: 'High',
    url: 'https://humanresearchroadmap.nasa.gov/',
  },
  {
    id: 'E-WORK',
    risk: 'Workload & Cognition',
    title: 'Risk of performance decrements from task overload and underload during long missions',
    org: 'NASA Human Research Program',
    year: 'Evidence Report',
    summary: 'Sustained overload erodes accuracy and mood while underload reduces vigilance. Workload balancing and rest protection are recommended first-line mitigations.',
    confidence: 'Medium',
    url: 'https://humanresearchroadmap.nasa.gov/',
  },
  {
    id: 'E-COMM',
    risk: 'Communication Delay & Autonomy',
    title: 'Operating with delayed or lost ground contact: onboard decision support needs',
    org: 'NASA Human Research Program',
    year: 'Evidence Report',
    summary: 'As communication delay grows, crews need autonomous health decision support. This underpins CrewPulse offline EarthLink mode.',
    confidence: 'Medium',
    url: 'https://humanresearchroadmap.nasa.gov/',
  },
];

export const ACTIONS = [
  { id: 'R-1', crew: 'CM-003', title: 'Adjust rest schedule — protect 8 h sleep opportunity', type: 'Countermeasure', priority: 'High', owner: 'Flight Surgeon', evidence: 'E-SLEEP' },
  { id: 'R-2', crew: 'CM-003', title: 'Reduce non-critical task load by 15% for 48 h', type: 'Workload', priority: 'High', owner: 'Mission Control', evidence: 'E-SLEEP' },
  { id: 'R-3', crew: 'CM-002', title: 'Schedule private psychological support conference', type: 'Behavioral', priority: 'Medium', owner: 'Flight Surgeon', evidence: 'E-BHP' },
  { id: 'R-4', crew: 'ALL', title: 'Team debrief and shared meal block', type: 'Cohesion', priority: 'Medium', owner: 'Commander', evidence: 'E-TEAM' },
  { id: 'R-5', crew: 'CM-004', title: 'Verify onboard medical decision-support cache', type: 'Medical', priority: 'Low', owner: 'Medical Officer', evidence: 'E-MED' },
];

export const PHASES = [
  { id: 'launch', name: 'Launch & Ascent', days: '1–2', start: 1, end: 2 },
  { id: 'tli', name: 'Trans-lunar Injection', days: '3–6', start: 3, end: 6 },
  { id: 'transit', name: 'Lunar Transit', days: '7–160', start: 7, end: 160 },
  { id: 'loi', name: 'Lunar Orbit & Ops', days: '161–190', start: 161, end: 190 },
  { id: 'return', name: 'Return & Re-entry', days: '191–209', start: 191, end: 209 },
];

export const RISK_AREAS = ['Sleep & circadian', 'Behavioral health', 'Team cohesion', 'Workload', 'Medical', 'Comms delay'];
// risk level 0-4 per area per phase
export const RISK_MAP = [
  [3, 1, 1, 4, 2, 0],
  [2, 2, 1, 3, 2, 1],
  [2, 3, 3, 2, 1, 3],
  [3, 2, 2, 4, 2, 4],
  [3, 2, 2, 3, 3, 2],
];

export const CREWS_GROUND = [
  { id: 'ARES-07', phase: 'Lunar transit', day: 142, readiness: 86, signals: 3, link: 'Nominal', status: 'Monitor' },
  { id: 'ARES-06', phase: 'LEO Station ops', day: 88, readiness: 91, signals: 1, link: 'Nominal', status: 'Nominal' },
  { id: 'LUNA-02', phase: 'Surface habitat', day: 21, readiness: 78, signals: 4, link: 'Delayed', status: 'Elevate' },
  { id: 'GATE-03', phase: 'Gateway outpost', day: 64, readiness: 89, signals: 1, link: 'Nominal', status: 'Nominal' },
];

export const SOURCES = [
  { id: 'wearables', name: 'Wearable biosensors', desc: 'HR, HRV, SpO₂, skin temperature', on: true },
  { id: 'sleep', name: 'Sleep actigraphy', desc: 'Sleep stages and circadian phase', on: true },
  { id: 'survey', name: 'Behavioral check-ins', desc: 'Daily mood and workload surveys', on: true },
  { id: 'comms', name: 'Communication analytics', desc: 'Interaction frequency, team cohesion', on: false },
  { id: 'ground', name: 'Ground EHR link', desc: 'Flight surgeon records sync', on: true },
  { id: 'env', name: 'Habitat environment', desc: 'CO₂, light, noise, temperature', on: true },
];

export const SHIELD_LAYERS = [
  { id: 'mon', name: 'Continuous monitoring', desc: 'Always-on biosensor and behavior signal capture.', weight: 24 },
  { id: 'pred', name: 'Predictive risk engine', desc: 'Forecasts health and behavioral risk up to 72 h ahead.', weight: 22 },
  { id: 'circ', name: 'Circadian shield', desc: 'Light and schedule countermeasures against fatigue.', weight: 18 },
  { id: 'psy', name: 'Psychological support', desc: 'Private support access and team cohesion programs.', weight: 18 },
  { id: 'auto', name: 'Autonomous medical support', desc: 'Onboard decision support when ground contact is lost.', weight: 18 },
];

export const ACCESS = {
  astronaut: ['dashboard','profile','vitals','behavioral','sleep','alerts','actions','shield','earthlink','evidence','assistant','settings'],
  surgeon: ['dashboard','profile','vitals','behavioral','sleep','prediction','breakdown','evidence','alerts','actions','shield','earthlink','timeline','reports','settings'],
  control: null,
};
export const roleHome = (r) => (r === 'control' ? '/app/mission-control' : '/app/dashboard');
export const canSee = (r, to) => !ACCESS[r] || ACCESS[r].includes(to.replace('/app/', ''));
