import { LemmaClient } from 'lemma-sdk'

// Local-dev auth: the deployed app authenticates via a same-site cookie, but on
// localhost there's no cookie, so the auth service would bounce you to the
// deployed URL. Instead, in dev we inject a Bearer token (from the Lemma CLI
// login) into localStorage — the SDK reads `lemma_token` first and skips the
// redirect entirely. This block is stripped from production builds.
if (import.meta.env.DEV) {
  const devToken = import.meta.env.VITE_LEMMA_DEV_TOKEN as string | undefined
  if (devToken) localStorage.setItem('lemma_token', devToken)
}

// Shared Lemma client for this app. Runtime config comes from .env.local
// (VITE_LEMMA_API_URL / VITE_LEMMA_AUTH_URL / VITE_LEMMA_POD_ID), which
// `lemma apps init` writes for you. import.meta.env is typed via
// "vite/client" in tsconfig.json.
export const lemmaClient = new LemmaClient({
  apiUrl: import.meta.env.VITE_LEMMA_API_URL,
  authUrl: import.meta.env.VITE_LEMMA_AUTH_URL,
  podId: import.meta.env.VITE_LEMMA_POD_ID,
})
