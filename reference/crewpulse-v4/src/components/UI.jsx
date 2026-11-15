import React from 'react';
import Icon from './Icon.jsx';
import { CREW } from '../data.js';
import { statusColor } from './Charts.jsx';
import { useStore } from '../store.jsx';

export const Card = ({ title, sub, right, children, className = '', pad = true }) => (
  <section className={`card ${className}`}>
    {(title || right) && (
      <div className="card-head">
        <div>
          {title && <h3>{title}</h3>}
          {sub && <p>{sub}</p>}
        </div>
        {right}
      </div>
    )}
    <div className={pad ? 'card-body' : ''}>{children}</div>
  </section>
);

export const PageHead = ({ eyebrow, title, desc, right }) => (
  <div className="page-head">
    <div>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1>{title}</h1>
      {desc && <p>{desc}</p>}
    </div>
    {right && <div className="page-head-right">{right}</div>}
  </div>
);

export const Pill = ({ status, children }) => (
  <span className="pill" style={{ color: statusColor(status), borderColor: statusColor(status) + '55', background: statusColor(status) + '18' }}>
    {children || status}
  </span>
);

export const Sev = ({ level }) => {
  const c = level === 'High' ? '#ef4444' : level === 'Moderate' ? '#f97316' : '#6ee3a3';
  return (
    <span className="pill" style={{ color: c, borderColor: c + '55', background: c + '18' }}>
      {level}
    </span>
  );
};

export function CrewPicker({ value, onChange }) {
  return (
    <div className="seg crew-seg" role="tablist">
      {CREW.map((c) => (
        <button key={c.id} className={value === c.id ? 'on' : ''} onClick={() => onChange(c.id)} role="tab" aria-selected={value === c.id}>
          <i style={{ background: statusColor(c.status) }} /> {c.name.split(' ')[0]}
        </button>
      ))}
    </div>
  );
}

export function useCrew() {
  const { crewId, setCrewId } = useStore();
  const crew = CREW.find((c) => c.id === crewId) || CREW[0];
  return [crew, setCrewId];
}

export const Btn = ({ children, variant = 'green', icon, onClick, ...rest }) => (
  <button className={`btn ${variant}`} onClick={onClick} {...rest}>
    {children}
    {icon && <Icon name={icon} size={14} />}
  </button>
);

export const Toggle = ({ on, onChange, label }) => (
  <button className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} aria-label={label}>
    <i />
  </button>
);
