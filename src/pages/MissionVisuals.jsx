import React, { useState } from 'react';
import { CREW, MISSION } from '../data.js';
import { useStore } from '../store.jsx';

const Metric = ({ label, value, unit, state = 'nominal' }) => <div className="neuro-metric"><span>{label}</span><b>{value}<small>{unit}</small></b><i className={`status-line ${state}`} /></div>;

function NerveBody() {
  return <svg className="nerve-body" viewBox="0 0 260 520" role="img" aria-label="Illustrative astronaut nervous system with brain, spinal cord and peripheral nerves">
    <defs><linearGradient id="bodyGlow" x1="0" x2="1"><stop stopColor="#0b7894" stopOpacity=".12"/><stop offset=".5" stopColor="#2dd4bf" stopOpacity=".25"/><stop offset="1" stopColor="#0b7894" stopOpacity=".12"/></linearGradient></defs>
    <path d="M130 24 C103 24 91 45 94 72 L99 94 C81 107 60 116 51 146 L34 226 Q31 245 47 249 Q59 251 64 235 L82 179 L87 254 L75 367 Q73 389 91 390 L105 287 L119 389 L113 478 Q111 495 127 496 Q141 497 143 481 L151 392 L165 479 Q168 496 183 492 Q196 488 191 472 L179 365 L170 253 L176 180 L196 235 Q201 251 215 247 Q229 241 221 222 L203 144 Q194 116 161 94 L166 70 Q169 39 147 27 Z" fill="url(#bodyGlow)" stroke="#28c7d4" strokeOpacity=".75" strokeWidth="1.5"/>
    <path d="M130 33 C112 33 105 48 107 65 C108 82 117 91 130 92 C144 91 153 81 154 64 C155 47 147 34 130 33Z" fill="#20b8ce" fillOpacity=".2" stroke="#39d9e8" strokeWidth="1.5"/>
    <g fill="none" stroke="#39d9e8" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M130 93 L130 220 M130 112 L106 135 L91 177 L81 218 M130 112 L154 135 L169 177 L180 218 M130 142 L109 174 L101 219 L93 268 M130 142 L151 174 L159 219 L167 268 M130 220 L111 272 L105 333 M130 220 L149 272 L155 333 M130 270 L119 337 L111 400 M130 270 L141 337 L149 400"/>
      <path d="M106 135 L91 153 M154 135 L169 153 M91 177 L72 195 M169 177 L188 195 M101 219 L83 239 M159 219 L177 239" strokeWidth="1.4"/>
    </g>
    <g fill="#8ff7f0" stroke="#1ba9c4" strokeWidth="1"><circle cx="130" cy="58" r="4"/><circle cx="130" cy="142" r="4"/><circle cx="91" cy="177" r="3"/><circle cx="169" cy="177" r="3"/><circle cx="101" cy="219" r="3"/><circle cx="159" cy="219" r="3"/><circle cx="111" cy="337" r="3"/><circle cx="149" cy="337" r="3"/></g>
  </svg>;
}

export function NervousSystem() {
  const { crewId, setCrewId } = useStore();
  const crew = CREW.find(c => c.id === crewId) || CREW[2];
  return <div className="page-stack">
    <div className="page-heading"><div><div className="eyebrow">CREW NEUROPHYSIOLOGY · LIVE SIMULATION</div><h1>Nervous system monitor</h1><p>Illustrative neural pathway visualisation paired with crew wellness signals.</p></div><span className="live-pill"><i/> SIMULATED FEED</span></div>
    <div className="neuro-toolbar"><label>CREW MEMBER<select value={crewId} onChange={e=>setCrewId(e.target.value)}>{CREW.map(c=><option key={c.id} value={c.id}>{c.name} · {c.id}</option>)}</select></label><span>MISSION {MISSION.id} / DAY {MISSION.day}</span></div>
    <div className="neuro-layout">
      <section className="panel neuro-visual"><div className="panel-head"><div><span className="eyebrow">NEURAL PATHWAY MAP</span><h2>Central & peripheral nervous system</h2></div><span className="scan-tag">BIO-SCAN 04</span></div><div className="body-stage"><div className="scan-ring ring-a"/><div className="scan-ring ring-b"/><NerveBody/><span className="callout brain-call">01 / COGNITIVE</span><span className="callout spine-call">02 / SPINAL</span><span className="callout nerve-call">03 / PERIPHERAL</span></div><div className="neuro-legend"><span><i className="legend-dot cyan"/> Neural pathways</span><span><i className="legend-dot mint"/> Signal nodes</span><span><i className="legend-dot orange"/> Attention zone</span></div></section>
      <section className="neuro-side"><div className="panel neuro-score"><span className="eyebrow">NEURO-READINESS INDEX</span><div className="score-row"><strong>{Math.max(0,Math.min(100,Math.round(100-crew.stress*.42+(crew.sleep-6)*3)))}</strong><span>/ 100<br/>SIMULATED</span></div><div className="score-track"><i style={{width:`${Math.max(0,Math.min(100,100-crew.stress*.42+(crew.sleep-6)*3))}%`}}/></div><p>Composite demonstration indicator, not a clinical assessment.</p></div><div className="panel"><div className="panel-head"><div><span className="eyebrow">SIGNAL SUMMARY</span><h2>Neuro-linked indicators</h2></div></div><div className="neuro-metrics"><Metric label="Heart rate" value={crew.hr} unit="BPM"/><Metric label="HRV" value={crew.hrv} unit="MS" state={crew.hrv<45?'watch':'nominal'}/><Metric label="Sleep" value={crew.sleep} unit="HRS" state={crew.sleep<6?'watch':'nominal'}/><Metric label="Stress index" value={crew.stress} unit="/100" state={crew.stress>60?'watch':'nominal'}/><Metric label="SpO₂" value={crew.spo2} unit="%"/><Metric label="Readiness" value={crew.readiness} unit="%"/></div></div><div className="panel signal-note"><b>Interpretation boundary</b><p>This display uses the prototype's synthetic crew dataset. It does not measure brain activity, nerve conduction, or diagnose neurological conditions.</p></div></section>
    </div>
  </div>;
}

export function RocketJourney() {
  const [progress,setProgress] = useState(68);
  const stages = [{at:0,name:'Earth departure'},{at:35,name:'Trans-lunar injection'},{at:68,name:'Lunar transit'},{at:100,name:'Lunar destination'}];
  const stage = [...stages].reverse().find(s=>progress>=s.at) || stages[0];
  return <div className="page-stack"><div className="page-heading"><div><div className="eyebrow">MISSION NAVIGATION · TRAJECTORY VISUALISATION</div><h1>Destination journey</h1><p>Explore the spacecraft's route from Earth toward the lunar destination.</p></div><span className="live-pill"><i/> TRAJECTORY SIMULATION</span></div>
    <section className="panel journey-panel"><div className="journey-top"><div><span className="eyebrow">ACTIVE FLIGHT PATH</span><h2>ARES-07 · Earth to Moon</h2><p>Illustrative mission trajectory — not live spacecraft navigation data.</p></div><div className="destination-chip">DESTINATION <b>MOON / LUNAR ORBIT</b></div></div>
      <div className="space-route"><div className="route-stars"/><div className="planet earth"><span>EARTH</span></div><svg className="trajectory" viewBox="0 0 900 300" preserveAspectRatio="none"><path d="M90 220 Q390 -35 790 130" stroke="#1b7897" strokeWidth="2" strokeDasharray="7 9" fill="none"/><path d="M90 220 Q390 -35 790 130" stroke="#48e0d0" strokeWidth="1" fill="none" opacity=".55"/></svg><div className="rocket-marker" style={{left:`${10+progress*.78}%`,top:`${72-Math.sin(progress/100*Math.PI)*36}%`}}>🚀</div><div className="planet moon"><span>MOON</span></div><div className="route-label earth-label">ORIGIN · EARTH</div><div className="route-label moon-label">DESTINATION · LUNAR ORBIT</div></div>
      <div className="journey-controls"><div><span className="eyebrow">MISSION PROGRESS</span><strong>{progress}%</strong></div><input type="range" min="0" max="100" value={progress} onChange={e=>setProgress(Number(e.target.value))} aria-label="Mission journey progress"/><div className="stage-caption"><span>Current phase</span><b>{stage.name}</b></div></div>
      <div className="stage-track">{stages.map(s=><div key={s.at} className={progress>=s.at?'reached':''}><i/><span>{s.name}</span></div>)}</div>
    </section>
    <div className="journey-metrics"><div className="panel"><span className="eyebrow">MISSION DAY</span><b>142 <small>/ 209</small></b><p>Current mission timeline</p></div><div className="panel"><span className="eyebrow">FLIGHT PHASE</span><b>{stage.name}</b><p>Trajectory phase estimate</p></div><div className="panel"><span className="eyebrow">CREW STATUS</span><b className="mint-text">Nominal monitoring</b><p>Linked to synthetic CrewPULSEx data</p></div></div>
  </div>;
}
