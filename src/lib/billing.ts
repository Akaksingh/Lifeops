import db from './db';

export function isPro(): boolean {
  const pref = db.prepare("SELECT value FROM user_prefs WHERE key = 'plan'").get() as
    | { value: string }
    | undefined;
  return pref?.value === 'pro';
}

export function setPro(active: boolean) {
  db.prepare("INSERT OR REPLACE INTO user_prefs (key, value) VALUES ('plan', ?)").run(
    active ? 'pro' : 'free'
  );
}
