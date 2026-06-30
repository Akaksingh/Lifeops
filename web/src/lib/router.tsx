import { useEffect, useState } from 'react';

// Minimal hash router — no dependency. Routes look like "#/calendar".
// The hosted app is served at the app subdomain root; hash routing keeps every
// view on a single served document (no server-side route handling needed).

export type Route = '/' | '/calendar' | '/sources' | '/insights' | '/settings';

function parse(): { path: Route; hash: string } {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, frag = ''] = raw.split('#');
  const known: Route[] = ['/', '/calendar', '/sources', '/insights', '/settings'];
  const clean = (path.split('?')[0] || '/') as Route;
  return { path: known.includes(clean) ? clean : '/', hash: frag };
}

export function useHashRoute(): { path: Route; hash: string } {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(to: string) {
  window.location.hash = to.startsWith('#') ? to : `#${to}`;
}
