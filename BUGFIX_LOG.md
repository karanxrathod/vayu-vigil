# Vayu Vigil — Full Diagnostic Pass & Bugfix Log

This document records the results of our end-to-end audit across every screen and user flow (`/`, `/onboarding`, `/app`, `/officer/login`, `/officer/dashboard`), documenting broken functionality, root causes, and verified fixes implemented before integrating real Cloud services.

---

## 1. API Routing 404s & Broken Endpoints
- **Affected Screens**: Landing Page (`/`), Citizen Home (`/app`), Officer Command Center (`/officer/dashboard`).
- **Issue**: Live hotspot telemetry and citizen report fetch requests were directed to `/api/hotspots` instead of `/api/v1/hotspots`.
- **Root Cause**: Mismatch between frontend fetch URLs and backend express router definitions (`app.use('/api/v1/hotspots', ...)`). This caused API calls to fail silently with 404 status codes and force fallback demo data.
- **Fix Implemented**: Updated all fetch endpoints across `app/page.tsx`, `app/app/page.tsx`, and `app/officer/dashboard/page.tsx` to strictly target `/api/v1/hotspots` and `/api/v1/reports`.

---

## 2. Payload Structure TypeErrors (`data.slice is not a function` / state corruption)
- **Affected Screens**: Landing Page (`/`), Citizen Home (`/app`), Officer Command Center (`/officer/dashboard`).
- **Issue**: When `/api/v1/hotspots` and `/api/v1/reports` successfully responded, state initialization crashed or rendered empty lists.
- **Root Cause**: Backend REST endpoints return wrapped JSON objects `{ hotspots: [...] }` and `{ reports: [...] }`, whereas frontend state setters assumed direct arrays (`[...]`), causing `.map()`, `.filter()`, and `.slice()` operations to throw TypeErrors.
- **Fix Implemented**: Added defensive unwrapping logic before state assignment across all dashboard views:
  ```typescript
  const list = Array.isArray(data) ? data : (data.hotspots || []);
  setHotspots(list);
  ```

---

## 3. Hardcoded Development Rewrites in Production (`next.config.js`)
- **Affected System**: Entire Frontend PWA networking layer.
- **Issue**: When deployed to hosting environments (like Vercel or Cloud Run), relative `/api/v1/...` API requests failed to communicate with separated backend services.
- **Root Cause**: `next.config.js` rewrites were hardcoded to `http://localhost:3001/api/v1/:path*`.
- **Fix Implemented**: Dynamic rewrite destination mapping using environment variables:
  ```javascript
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  destination: `${apiUrl}/api/v1/:path*`
  ```

---

## 4. Unhandled Runtime Rendering & Promise Rejections (White Screen of Death)
- **Affected System**: App Layout (`/app/layout.tsx`) and all child page components.
- **Issue**: An unhandled exception during component rendering or malformed data deserialization resulted in a complete blank white screen with no user recovery option.
- **Root Cause**: Absence of a top-level React Error Boundary in the Next.js App Router tree.
- **Fix Implemented**: Created `components/ErrorBoundary.tsx` featuring a civic-themed recovery interface with error telemetry logging, a "Reload Screen" action, and navigation back to Home. Wrapped `{children}` inside `app/layout.tsx`.
