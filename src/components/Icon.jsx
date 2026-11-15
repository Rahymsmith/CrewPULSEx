import React from 'react';

const P = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  user: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M17 5.5a3 3 0 0 1 0 5.8M18.5 14.3c1.9.7 3 2.5 3 5.2" /></>,
  heart: <path d="M12 20s-8-4.9-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.1-8 11-8 11z" />,
  brain: <><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1z" /><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1" /></>,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  spark: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5M8 7h7" /></>,
  layers: <><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></>,
  bell: <><path d="M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15z" /><path d="M10 21h4" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.5" /></>,
  rocket: <><path d="M14 4c3-1 5-1 6-1 0 1 0 3-1 6l-6 6-5-5z" /><path d="M9 14l-4 1 2 2M10 15l-1 4 2-2M15 8.5h.01" /></>,
  shield: <><path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z" /><path d="M8.5 12l2.5 2.5L16 9.5" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  radar: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><path d="M12 12l6-6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  file: <><path d="M6 3h8l5 5v13H6z" /><path d="M14 3v5h5M9 13h7M9 17h7" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></>,
  arrowUpRight: <path d="M7 17L17 7M8 7h9v9" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  trendUp: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  trendFlat: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="18" cy="9" r="2.5" /></>,
  alert: <><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  satellite: <><rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(45 12 12)" /><path d="M4 8l4 4M16 12l4 4M6 18l2-2M16 8l2-2" /></>,
  wifiOff: <><path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" /><path d="M12 20h.01M3 3l18 18" /></>,
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  play: <path d="M7 4l13 8-13 8z" />,
  pause: <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>,
  zap: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  drop: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  lung: <path d="M12 4v8M12 12c0 4-2 7-5 7-2.5 0-3-2-3-5 0-4 2-8 4-8 1.5 0 4 1 4 6zM12 12c0 4 2 7 5 7 2.5 0 3-2 3-5 0-4-2-8-4-8-1.5 0-4 1-4 6z" />,
  thermo: <path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>,
  logout: <path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" />,
};

export default function Icon({ name, size = 18, stroke = 1.8, className = '', style }) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {P[name] || P.grid}
    </svg>
  );
}
