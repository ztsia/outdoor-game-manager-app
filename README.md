# Outdoor Game Manager

A real-time Progressive Web App for running outdoor team-based games — territory battles, world tour challenges, and live leaderboards — across multiple concurrent devices.

**[Live Demo](https://outdoor-game-manager-app.vercel.app/)**&nbsp; · &nbsp;Built with React 19, Firebase Firestore, Tailwind CSS 4

---

## Key Engineering Challenges

### Preventing race conditions in concurrent territory attacks

When multiple teams attack simultaneously, naive read-then-write causes double-spends and corrupted state. Every attack flows through a Firestore `runTransaction()` in `challengeService.js` that atomically verifies preconditions (territory is idle, attacker has sufficient followers, cooldown expired) and writes the state transition in a single round-trip. A pre-check outside the transaction short-circuits the obvious error cases before incurring the transaction overhead — but the transaction's own read still validates that nothing changed in the window between the two checks.

### Server-authoritative timer sync without polling

Shared game timers must stay in sync across arbitrarily many devices without constant server writes. The approach: on start, write a single `timer_started_at: Timestamp.now()` to Firestore. Every client independently computes `elapsed = (client.now - timer_started_at) / 1000` on each render — no polling, no drift accumulation. Pause stores the elapsed snapshot in `shared_elapsed_seconds` and nulls `timer_started_at`; resume restores the baseline and writes a fresh timestamp. Clients that join mid-game reconstruct the correct state from the two fields alone.

### Cooperative game resolution with race-safe consensus

Neither player can unilaterally declare victory. Resolution is a two-phase commit: both players independently submit a vote (attacker won / defender won), and a Firestore effect watcher detects consensus. On match → `resolveGame()` runs a transaction that checks `challenge_status === 'accepted'` before writing — if another client already resolved, it returns false and the local client detects the completed state via a passive watcher on the territory document. Vote mismatch (both players disagree on the outcome) triggers a dispute modal and resets votes for re-submission.

### Adaptive SVG territory labels

Territory shapes are defined as raw coordinate strings (rectangles or polygon point lists). At render time, `parseCoords()` normalises both formats to a centroid + bounding box. For polygons, the centroid uses the Shoelace formula to handle concave shapes correctly. Labels are rendered via `foreignObject` (enabling native CSS overflow and `-webkit-line-clamp`) and sized through a four-tier algorithm — TINY shapes get an external leader-line label; larger shapes fit progressively more detail. Font size is clamped: `Math.max(11, Math.min(width/6, height/10, 28))`.

### Stateless role-based routing with per-team theming

There's no user account system. Each physical device enters an access code that maps to a role (Manager / HQ / Admin) and, for team devices, a team ID and CSS theme class. On valid code entry, `signInAnonymously()` fires (for Firestore security rule compatibility), and the role + team + theme are persisted to `localStorage`. The theme class is applied to `document.documentElement`, scoping all CSS custom properties for that device's colour scheme without any UI branching. Protected routes redirect to each role's home page if the stored role doesn't match.

---

## Features

| Area | Details |
|------|---------|
| **Territory Battles** | Transaction-based attacks · mutual exclusion · bet-based economy with automatic refunds · configurable cooldowns |
| **World Tour Challenges** | Custom formula scoring (`hot-formula-parser`) · difficulty multipliers (1×/2×/3×) · Fan Favourite title transfers on new high score |
| **Ranking System** | `score = followers + (stars × 20k) + (fan_favourites × 100k)` · tiered thresholds (Rookie → Rising Star → Legend) · singleton "Living Icon" title for top Legend |
| **HQ Map** | SVG territory map with real-time owner colours, battle indicators, and mm:ss cooldown countdowns |
| **Admin Panel** | CRUD for teams, territories, world tour games, locations, question sets · system config editor · blind box / promo code management |
| **PWA** | Service worker caching · installable on iOS and Android · mobile-optimised viewport |

---

## Tech Stack

| | |
|---|---|
| **Frontend** | React 19, Tailwind CSS 4, shadcn/ui, Framer Motion |
| **Backend** | Firebase Firestore (real-time), Firebase Anonymous Auth |
| **Build** | Vite 7, Vite PWA Plugin |
| **Libraries** | `hot-formula-parser` for dynamic scoring formulas |

---

## Project Structure

```
src/
├── services/
│   ├── challengeService.js     # Attack transactions and state machine
│   ├── gameService.js          # Territory / World Tour CRUD + subscriptions
│   ├── rankService.js          # Weighted scoring and tier calculation
│   └── blindBoxService.js      # Promo code atomic redemption
├── hooks/
│   ├── useGameHost.js          # Territory battle state + voting logic (~400 lines)
│   ├── useWorldTourHost.js     # World Tour game state and score submission
│   └── useAttackTransaction.js # Tiered attack cost calculation
├── components/
│   ├── hq/TerritoryRect.jsx    # SVG territory rendering with adaptive labels
│   └── game/                   # Scoreboard, timer, vote modal components
├── contexts/AuthProvider.jsx   # Access code → role/theme mapping
├── pages/
│   ├── TerritoryGamePage.jsx   # PvP battle host with consensus resolution
│   ├── HQ.jsx                  # Live command-centre map view
│   └── Admin.jsx               # Game administration
└── lib/formulaEvaluator.js     # Excel-formula parsing for dynamic scoring
```

---

## Local Setup

**Prerequisites:** Node.js v18+, a Firebase project with Firestore enabled.

```bash
git clone https://github.com/your-username/outdoor-game-manager-app.git
cd outdoor-game-manager-app
npm install
```

Create `.env` in the project root:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

```bash
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview production build
```

Firestore collection schemas are documented in [dbSchema.md](dbSchema.md).
