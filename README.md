# Pankaj & Neetu Wedding Manager

This repository now contains the **complete deployed static web/PWA application** and the **Android WebView app**.

| Path | Purpose |
| --- | --- |
| [web/](web/) | HTML, CSS, JS, service worker, offline PWA, Shopping, family checklist, expenses, payments, media, invitations, and reminders |
| [app/](app/) | Android Java WebView wrapper and native file/camera/download integration |
| [.github/workflows/android-apk.yml](.github/workflows/android-apk.yml) | Android debug APK build |
| [.github/workflows/web-ci.yml](.github/workflows/web-ci.yml) | Web asset integrity and syntax checks |

## Web application

Current existing URL: https://pankaj-wedding-roadtrip-checklist.vercel.app/

Run locally:

```bash
python3 -m http.server 8080 --directory web
```

Then open http://localhost:8080.

**Vercel:** connect this repository to the existing Vercel project, set **Root Directory = web**, **Framework = Other** and leave Build Command blank. The existing Vercel project was previously deployed via API without repository linkage. Until that connection is made, GitHub pushes do **not** automatically publish to the existing URL. Read [web/README.md](web/README.md) for migration safeguards.

## Android application

The Android shell launches the above HTTPS URL in WebView. It includes Android Back handling, multi-file selection (images, PDFs and JSON), camera capture and downloads. The existing GitHub Actions workflow builds the debug APK; see Actions → Android APK.

Android WebView storage is distinct from Chrome's IndexedDB/localStorage. **Do not clear application storage or uninstall the app until you have exported and verified a Full Evidence Backup or completed private cloud sync.** A GitHub migration moves source files, not private browser data.

## Security and privacy

The repository is **public**. Do not commit personal contacts, purchased-item data exports, scanned receipts, photographs, environment files, Supabase service-role keys, access tokens or APK signing credentials. Personal phone numbers were removed from the web source seed records when the deployed files were mirrored. Private runtime records remain outside GitHub.

No paid infrastructure is required for the static web app or the existing Android debug workflow. Supabase connectivity requires independent configuration and verification.
