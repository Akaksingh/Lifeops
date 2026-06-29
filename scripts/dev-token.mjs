// Refresh the local dev auth token.
//
// Hosted Lemma's session cookie can't be shared with a localhost dev app
// (different sites → cross-site cookie blocking; the SDK calls this out in
// auth.js → checkAuth). So for local dev we inject a bearer token instead.
//
// This writes the current `lemma auth print-token` JWT to .lemma-dev-token
// (gitignored). The dev-only /api/dev-token route serves it, and LemmaShell
// injects it via setTestingToken before the client initializes.
//
// The JWT expires in ~1h. When the app starts showing "Sign In" again:
//   npm run lemma:token   # rewrites the file
//   then just refresh the browser (no dev-server restart needed).

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

let token = '';
try {
  token = execSync('lemma auth print-token', { encoding: 'utf8', shell: true }).trim();
} catch (err) {
  console.error('✗ Could not run `lemma auth print-token`. Is the Lemma CLI installed and are you logged in (`lemma auth login`)?');
  console.error('  ', err?.message || err);
  process.exit(1);
}

if (!token) {
  console.error('✗ Got an empty token. Try `lemma auth login` and retry.');
  process.exit(1);
}

writeFileSync('.lemma-dev-token', token);
console.log('✓ Wrote .lemma-dev-token (length', token.length + ', expires ~1h).');
console.log('  Refresh http://localhost:3000 in your browser — no restart needed.');
