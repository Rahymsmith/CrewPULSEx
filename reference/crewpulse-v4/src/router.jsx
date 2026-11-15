// Tiny dependency-free hash router (HashRouter / Routes / Route / NavLink / Outlet / Navigate)
// Hash routing means the built site works from any static host or even file://.
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const RouterCtx = createContext({ pathname: '/', navigate: () => {} });
const OutletCtx = createContext(null);

const readPath = () => {
  const h = window.location.hash.replace(/^#/, '');
  const p = h.split('?')[0] || '/';
  return p.startsWith('/') ? p : '/' + p;
};

export function HashRouter({ children }) {
  const [pathname, setPathname] = useState(readPath);
  useEffect(() => {
    const on = () => setPathname(readPath());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const navigate = useCallback((to, opts = {}) => {
    if (typeof to === 'number') return window.history.go(to);
    if (opts.replace) window.location.replace('#' + to);
    else window.location.hash = '#' + to;
    return undefined;
  }, []);
  const value = useMemo(() => ({ pathname, navigate }), [pathname, navigate]);
  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>;
}

export const useLocation = () => ({ pathname: useContext(RouterCtx).pathname });
export const useNavigate = () => useContext(RouterCtx).navigate;
export const Outlet = () => useContext(OutletCtx);

export function Route() {
  return null; // configuration only, read by <Routes>
}

const join = (base, p) => (p.startsWith('/') ? p : `${base.replace(/\/$/, '')}/${p}`).replace(/\/+/g, '/');

function toRoutes(children) {
  return React.Children.toArray(children)
    .filter((c) => c && c.props)
    .map((c) => ({ ...c.props, children: c.props.children ? toRoutes(c.props.children) : null }));
}

function match(routes, pathname, base = '') {
  for (const r of routes) {
    if (r.index) {
      if (pathname.replace(/\/$/, '') === base.replace(/\/$/, '')) return [r];
      continue;
    }
    if (r.path === '*') return [r];
    const full = join(base, r.path || '');
    if (r.children) {
      if (pathname === full || pathname.startsWith(full + '/')) {
        const sub = match(r.children, pathname, full);
        if (sub) return [r, ...sub];
      }
    } else if (pathname.replace(/\/$/, '') === full.replace(/\/$/, '') || (full === '/' && pathname === '/')) {
      return [r];
    }
  }
  return null;
}

export function Routes({ children }) {
  const { pathname } = useContext(RouterCtx);
  const routes = useMemo(() => toRoutes(children), [children]);
  const chain = match(routes, pathname);
  if (!chain) return null;
  return chain.reduceRight((child, r) => <OutletCtx.Provider value={child}>{r.element}</OutletCtx.Provider>, null);
}

export function Navigate({ to, replace }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [to, replace, navigate]);
  return null;
}

export function NavLink({ to, className, children, onClick, ...rest }) {
  const { pathname } = useContext(RouterCtx);
  const isActive = pathname === to;
  const cls = typeof className === 'function' ? className({ isActive }) : className;
  return (
    <a href={'#' + to} className={cls} aria-current={isActive ? 'page' : undefined} onClick={onClick} {...rest}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </a>
  );
}

export const Link = ({ to, ...rest }) => <NavLink to={to} {...rest} />;
