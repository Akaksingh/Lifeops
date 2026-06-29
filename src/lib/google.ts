// Server-side Google OAuth helper. Uses the long-lived refresh token to mint
// fresh access tokens on demand (cached in memory until shortly before expiry),
// so the app never depends on the 1-hour access token in .env.local.

let cache: { token: string; exp: number } | null = null;

export async function getGoogleAccessToken(): Promise<string | null> {
  const refresh_token = process.env.GOOGLE_REFRESH_TOKEN;
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!refresh_token || !client_id || !client_secret) return null;

  // Reuse the cached token until 60s before it expires.
  if (cache && Date.now() < cache.exp - 60_000) return cache.token;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id, client_secret, refresh_token, grant_type: 'refresh_token' }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    cache = { token: data.access_token, exp: Date.now() + (data.expires_in ?? 3600) * 1000 };
    return cache.token;
  } catch {
    return null;
  }
}

export function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
