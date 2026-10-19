# 60-Day Mental Toughness (Mobile-first, PWA, static build)

A single-user, mobile-first web app to track a 60-day mental toughness program. No backend or accounts — your progress is stored locally in `localStorage`. Installable as a PWA and deployable anywhere as static files.

## Features
- **Daily checklist (6 rules):** workout, strict diet, 3 Power Tasks, gratitude, visualization, cold shower.
- **Power Tasks:** editable text for today and tomorrow; rule counts done when all three are checked.
- **Evening block:** gratitude, quick review notes, write tomorrow’s three Power Tasks, screens off/lights down.
- **Program logic:** start Day 1, calendar-based day advancement, automatic streak reset if any past day missed, 60-day completion celebration, simple history and attempts log, manual reset with confirmation.
- **PWA:** `manifest.webmanifest` + service worker for offline.

## Stack
- Vite + React + TypeScript
- Self-contained static build with **relative asset paths**

## Local development

```bash
cd app
npm ci
npm run dev
```

Dev server runs on your machine (configured in `vite.config.ts`) and binds to an uncommon port.

## Build and deploy

Exact build command:
```bash
cd app
npm run build
```

Output folder:
```
app/dist/
```

The build uses relative asset paths (`base: './'`) and works from any static server at the root path. Serve `app/dist/` with your preferred static server or tunnel (no server-side logic required).

Examples:
```bash
# any static server works; these are just examples
npx serve app/dist
# or
python -m http.server -d app/dist 43124
```

## GitHub Pages

- Production (after merge to `main`): deployed automatically by GitHub Actions to Pages at:
  - https://antoniosan333.github.io/mt60-tracker/
- Pre-merge preview: this branch includes a committed static build in `docs/`. Point the repo’s Pages setting to "Deploy from a branch" → this branch → `/docs` to preview on a phone immediately.

The app is PWA-safe under a subpath. `vite.config.ts` sets `base: './'`, `index.html` uses a relative favicon, the manifest has `start_url: "./"`, and the service worker registers with `./sw.js`, so assets resolve correctly at `/mt60-tracker/`.

## Tests
Basic tests for day math and reset logic are included. Run:
```bash
cd app
npm test
```

## Notes
- Data is stored locally in the browser. Clearing site data clears your progress.
- iOS and some Android variants may require adding to home screen from the browser menu to install the PWA.
