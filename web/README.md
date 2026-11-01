# Web/PWA source

This directory contains the **47 static production files** mirrored from Vercel deployment `dpl_77F8mPLzPAgiHbn1SQpeQVBA8uwW` on 1 November 2026. It includes the last-deployed saree classification, receipt assistant, family checklist, payment reconciliation, offline service worker, media and memory diary, reminders and travel modules.

## Local development

From repository root: `python3 -m http.server 8080 --directory web` and open `http://localhost:8080`.

## Vercel deployment

To use the same existing domain, connect **this GitHub repository** in Vercel project `pankaj-wedding-roadtrip-checklist` with **Root Directory** `web`. Choose **Other** framework and no build command. If an ignored build step is configured, disable it. Only connect after verifying the new GitHub checkout and preserving browser/Android local data.

Web routes reference root-relative paths such as `/core.js`; serving the repo root (rather than `web/`) will break the application. Avoid deploying at a different origin unless you deliberately migrate user records: IndexedDB and the PWA service-worker cache are origin-specific.

## Public repository safety

The files were copied from the public production static site, with direct personal phone literals scrubbed from seed records. Runtime data, receipts, private documents, media evidence, access tokens, cloud database contents and authentication sessions are **not** in GitHub. Keep secrets in Vercel/GitHub Secrets, not source files.
