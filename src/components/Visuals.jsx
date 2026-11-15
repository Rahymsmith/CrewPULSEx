import React, { useEffect, useRef } from 'react';

/** Parallax starfield on a canvas (fixed behind content). */
export function Starfield({ density = 140, speed = 0.04 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext('2d');
    let w, h, raf;
    const stars = [];
    const resize = () => {
      w = c.width = c.offsetWidth * devicePixelRatio;
      h = c.height = c.offsetHeight * devicePixelRatio;
    };
    resize();
    for (let i = 0; i < density; i++) stars.push({ x: Math.random(), y: Math.random(), z: Math.random() * 0.9 + 0.1, t: Math.random() * 6 });
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y += speed * s.z * 0.002;
        if (s.y > 1) s.y = 0;
        const a = 0.35 + 0.65 * Math.abs(Math.sin(t / 1400 + s.t));
        ctx.fillStyle = `rgba(190,210,255,${a * s.z})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.z * 1.3 * devicePixelRatio, 0, 7);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [density, speed]);
  return <canvas ref={ref} className="starfield" />;
}

/** Interactive 3D dotted globe with orbiting satellites. Drag to rotate. */
export function Globe({ size = 360, dots = 650, color = '110,160,255', orbit = true }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = size * dpr;
    c.height = size * dpr;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    const pts = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < dots; i++) {
      const yy = 1 - (i / (dots - 1)) * 2;
      const r = Math.sqrt(1 - yy * yy);
      const th = ga * i;
      pts.push([Math.cos(th) * r, yy, Math.sin(th) * r]);
    }
    let rotY = 0;
    let rotX = -0.35;
    let drag = null;
    let raf;
    const R = size * 0.34;
    const cx = size / 2;
    const cy = size / 2;
    const proj = (p, ry, rx) => {
      let [x, y, z] = p;
      const cr = Math.cos(ry), sr = Math.sin(ry);
      [x, z] = [x * cr + z * sr, -x * sr + z * cr];
      const cX = Math.cos(rx), sX = Math.sin(rx);
      [y, z] = [y * cX - z * sX, y * sX + z * cX];
      return [x, y, z];
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, size, size);
      const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.5);
      g.addColorStop(0, `rgba(${color},.18)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      if (!drag) rotY += 0.004;
      for (const p of pts) {
        const [x, y, z] = proj(p, rotY, rotX);
        const a = (z + 1) / 2;
        ctx.fillStyle = `rgba(${color},${0.12 + a * 0.85})`;
        ctx.beginPath();
        ctx.arc(cx + x * R, cy + y * R, 0.7 + a * 1.4, 0, 7);
        ctx.fill();
      }
      if (orbit) {
        for (let k = 0; k < 3; k++) {
          const tilt = [0.5, -0.7, 1.15][k];
          ctx.strokeStyle = `rgba(${color},.22)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let a = 0; a <= 6.3; a += 0.1) {
            const rr = R * (1.35 + k * 0.12);
            const [x, y] = proj([Math.cos(a) * rr / R, 0, Math.sin(a) * rr / R], rotY * 0.3 + tilt, rotX + tilt * 0.4);
            a === 0 ? ctx.moveTo(cx + x * R, cy + y * R) : ctx.lineTo(cx + x * R, cy + y * R);
          }
          ctx.stroke();
          const sa = t / (1800 + k * 700) + k * 2;
          const rr = 1.35 + k * 0.12;
          const [sx, sy, sz] = proj([Math.cos(sa) * rr, 0, Math.sin(sa) * rr], rotY * 0.3 + tilt, rotX + tilt * 0.4);
          ctx.fillStyle = k === 1 ? '#6ee3a3' : '#9fc0ff';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = sz > 0 ? 12 : 3;
          ctx.beginPath();
          ctx.arc(cx + sx * R, cy + sy * R, 3.2, 0, 7);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    const down = (e) => (drag = { x: e.clientX, y: e.clientY });
    const move = (e) => {
      if (!drag) return;
      rotY += (e.clientX - drag.x) * 0.01;
      rotX = Math.max(-1.2, Math.min(1.2, rotX + (e.clientY - drag.y) * 0.01));
      drag = { x: e.clientX, y: e.clientY };
    };
    const up = () => (drag = null);
    c.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      cancelAnimationFrame(raf);
      c.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [size, dots, color, orbit]);
  return <canvas ref={ref} style={{ width: size, height: size, cursor: 'grab', touchAction: 'none' }} aria-label="Interactive 3D globe" />;
}

/** Mouse-driven 3D tilt wrapper. */
export function Tilt({ children, max = 8, className = '', style, as: Tag = 'div', ...rest }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateZ(0)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = '';
  };
  return (
    <Tag ref={ref} className={`tilt ${className}`} style={style} onMouseMove={onMove} onMouseLeave={reset} {...rest}>
      {children}
    </Tag>
  );
}

/** Rotating 3D shield rings (pure CSS 3D). layers: [{id, on}] */
export function ShieldRings({ layers }) {
  return (
    <div className="shield3d">
      <div className="shield-core">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#6ee3a3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z" />
          <path d="M8.5 12l2.5 2.5L16 9.5" />
        </svg>
      </div>
      {layers.map((l, i) => (
        <div key={l.id} className={`ring ${l.on ? 'on' : 'off'}`} style={{ '--i': i, '--n': layers.length }} />
      ))}
    </div>
  );
}

export const Logo = ({ size = 28 }) => (
  <span className="logo">
    <span className="logo-mark" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="#fff">
        <path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" />
      </svg>
    </span>
    <span className="logo-text">
      Crew<span>Pulse</span>
    </span>
  </span>
);
