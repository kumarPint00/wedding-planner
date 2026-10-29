# Pankaj & Neetu Wedding Manager — Android

This is the native Android shell for the existing Wedding Manager at:

https://pankaj-wedding-roadtrip-checklist.vercel.app/

It loads the existing HTTPS web app inside Android WebView, including Tasks, Shopping, Guests, Media, private Supabase sign-in, and Travel. It adds Android Back handling, native file selection (multiple images, PDFs and JSON), camera capture, and HTTP(S) downloads.

## Important data migration

Android WebView does **not** share IndexedDB or localStorage with Chrome. Your old browser edits will not automatically appear inside the APK.

Before switching, export a **Full Evidence Backup** in the web browser (Settings). In the APK, use **Restore Full Backup** on Settings. Alternatively, finish the **Private Cloud** Supabase setup in the browser, verify synchronization, and sign into the same account in the APK. Do not delete the Chrome/PWA data until you verify all records and photos in Android.

## Free debug APK build

GitHub Actions builds a debug-signed installable APK when code changes are pushed. Open **Actions → Android APK** and download the `wedding-manager-debug-apk` artifact.

Debug APK builds are for personal/sideload distribution, not Google Play. For Play Store, create and securely manage your own release signing key and complete store publication checks.

## Notes

- Requires internet on first launch; the PWA's service worker cache may support some offline screens after they are visited, but cloud sync and uploads need network.
- Android 10+ (API 29), and a working Android System WebView.
- Real Supabase E2E synchronization requires a connected Supabase project and login; the build alone cannot activate the backend.
- Photos and evidence stay private in Android app-local storage unless your Supabase Storage bucket is properly configured.
- No private ticket PDFs, guest lists, passwords, or API secrets are committed to this public repository.

Build verification: APK compilation and on-device E2E testing must be confirmed before use.
