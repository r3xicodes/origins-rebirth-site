# origins-ascendants-site

## Progressive Web App (PWA)
This site now includes a basic PWA setup so it can be installed on mobile devices.

What's included:
- `manifest.json` (name, icons, theme color, start_url)
- `sw.js` — basic service worker for offline caching of core pages and assets
- Install prompt handling and a small install banner in the header

How to test locally:
1. Serve the site from a local web server (e.g., `npx http-server` or `python -m http.server`) — service workers require HTTPS or localhost.
2. Open Chrome/Edge, open DevTools → Application → Manifest to inspect. The site should show as installable when criteria are met.
3. In DevTools → Application → Service Workers you can see and control the registered service worker.

Next steps (optional):
- Add better icons and platform-specific splash screens.
- Add more advanced caching strategies (runtime cache, stale-while-revalidate).
- Wrap with Capacitor for Play Store / App Store builds.
