# 🧭 Vayu Vigil — Information Architecture & Route Map

> **Vayu Vigil** (formerly CleanAir & Clear Streets) is a hyper-local environmental intelligence and municipal action platform built for the **Build with AI: Code for Communities** national hackathon (Google Cloud x Hack2skill).

---

## 🗺️ Complete Route Map & Information Architecture

```mermaid
graph TD
    A[Public Landing Page<br/><b>/</b>] -->|Get Started / Report Pollution| B[Citizen Onboarding Wizard<br/><b>/onboarding</b>]
    A -->|Explore Live Map| C[Citizen Community Portal<br/><b>/app</b>]
    A -->|Officer Portal Login| D[Officer Authentication<br/><b>/officer/login</b>]
    
    B -->|Complete 4-Step Wizard| C
    B -->|Skip Onboarding / Guest Mode| C
    
    subgraph Citizen Experience [/app]
        C1[🏠 Home Feed]
        C2[🗺️ Interactive Map]
        C3[➕ Report Incident]
        C4[📋 My Reports]
        C5[👤 Profile & Settings]
    end
    C --> C1 & C2 & C3 & C4 & C5
    
    D -->|Step 1: Creds & Demo Quick-Fill<br/>Step 2: 6-Digit 2FA Code| E[Municipal Command Center<br/><b>/officer/dashboard</b>]
    
    subgraph Officer Command Experience [/officer/dashboard]
        E1[📊 Hotspot Queue & Dispatch]
        E2[🗺️ GIS Grid Map]
        E3[🔌 Grid Expansion & IoT/Sentinel-5P]
        E4[📈 KPI Analytics & Ward Leaderboard]
        E5[⚙️ Ward & Hardware Settings]
    end
    E --> E1 & E2 & E3 & E4 & E5
```

---

## 🔐 Role-Based Access Control (RBAC) & State Transitions

### 1. Anonymous / Guest State
- **Default Route**: `/` (Landing Page)
- **Permissions**: Can view public hero statistics, teaser map, and information on how the system works.
- **State Behavior**: If an anonymous user navigates to `/app`, they enter **Guest Mode**. A prominent amber alert banner encourages them to complete `/onboarding` to enable GPS snapping and SMS status notifications.

### 2. Citizen / Resident State
- **Entry Route**: `/onboarding` (Language selection, OTP mobile verification, Location permission, Camera/Mic permission).
- **Core Workspace**: `/app`
- **Permissions**:
  - Submit geo-tagged photo/video complaints with AI Vision verification (`VV-XXXX` tracking IDs).
  - Track live resolution progress via the 3-Step Stepper (Logged ➔ Inspecting ➔ Resolved).
  - Switch language dynamically (English, Hindi, Marathi) with instant UI updates and persistent storage.

### 3. Municipal Officer & Global Admin State
- **Entry Route**: `/officer/login` (Official Gov credentials + 1-Click Hackathon Demo Buttons + 2FA security code verification).
- **Core Workspace**: `/officer/dashboard`
- **Permissions**:
  - Full access to Ward Hotspot Queue sorted by AI risk score and DPCC sensor telemetry.
  - Dispatch municipal water-mist tankers and smog guns with automated GPS routing.
  - Test real IoT hardware MQTT brokers, Sentinel-5P satellite aerosol ingestion, Twilio WhatsApp bot simulator, and vehicle spraying simulations.

---

## ✅ Resolution of All 7 Concrete UX Bugs

| # | Concrete UX Bug | Root Cause in Old System | Vayu Vigil Solution |
|---|---|---|---|
| **1** | **No clear back navigation or breadcrumbs** | Sub-views like Hotspot Detail or Report Modal trapped users with no obvious exit. | Every modal has a dedicated close button (`X` and explicit cancel buttons). Login and Dashboard screens have explicit "Back" buttons and persistent navigation headers. |
| **2** | **Form data lost on validation failure** | When an API error occurred during complaint submission, React state was reset. | `ReportModal.tsx` retains all user inputs (title, category, description, coordinates, media preview) when a network or validation error occurs, displaying a toast notification instead of clearing state. |
| **3** | **Empty states look like broken pages** | Empty arrays rendered blank white boxes or text like `"0 items"`. | Built a dedicated `<EmptyState />` UI helper component with friendly illustrations, clear explanations, and actionable CTA buttons across `/app` and `/officer/dashboard`. |
| **4** | **No loading feedback on slow networks** | API calls froze the UI without visual indicators. | All action buttons include animated spinner spinners (`lucide-react` RefreshCw/Loader) and disabled states during asynchronous operations. |
| **5** | **No toast notifications for success/error** | Actions succeeded or failed silently in background console logs. | Created a global `<ToastContainer />` in `app/layout.tsx` and exported `showToast()`. Instant color-coded notifications appear for login, logout, report submissions, and language switches. |
| **6** | **Map layer legend missing or unclear** | Users couldn't decode severity circle colors or pollutant icons on the Leaflet map. | Added a WCAG-compliant, always-visible legend overlay in `HotspotMap.tsx` at the bottom-left explaining Critical (Red), Moderate (Amber), and Low (Green) severity circles and Pollutant Icons (🔥, 🏗️, 🏭, 🚌). |
| **7** | **Language toggle resets on page navigation** | Language selection was stored in local component state and lost on route changes. | Integrated persistent `localStorage.getItem('vayu_vigil_lang')` with custom browser window events (`vayu-vigil-lang-change`) so switching language in `Navbar` instantly synchronizes across all active components and routes. |

---

## 🚀 Hackathon Live Evaluation Guide

When presenting live to judges or Members of Parliament:
1. **Start at `/`**: Highlight the professional civic branding, clear value proposition, and real-time statistics.
2. **Click "Report Pollution Now"**: Show the 4-step wizard at `/onboarding` (demonstrates citizen empathy and accessibility).
3. **Explore `/app`**: Show the mobile tab navigation, live reports feed, and interactive map with the always-visible legend.
4. **Login at `/officer/login`**: Click the **"🔥 Ward 1 Officer"** demo button, then enter 2FA code `889900`.
5. **Command Center `/officer/dashboard`**:
   - In **Queue**, click on *Bhalswa Landfill Sector 12* to show AI EWMA forecasting and click **"Dispatch Water-Mist Tanker"**.
   - In **Grid Expansion**, run the live **IoT Sensor MQTT Ping**, **Sentinel-5P Satellite Scan**, and **Twilio WhatsApp Bot Simulator**.
