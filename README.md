# 🎮 Outdoor Game Manager

A real-time Progressive Web App (PWA) for managing outdoor team-based games, territory battles, and world tour challenges. Built with React 19, Firebase, and Tailwind CSS.

## ✨ Features

### Team Management
- **Multi-team support** with customizable names, colors, and avatars
- **Follower-based ranking system** with rank badges (Rookie → Rising Star → Legend)
- **Live leaderboards** with real-time updates

### 🎮 Real-Time Multiplayer Game Engine
- **Live state synchronization** using Firestore real-time subscriptions across unlimited concurrent players
- **Server-authoritative timers** with timestamp-based synchronization to prevent clock drift between devices
- **Consensus-based game resolution** with dual-voting system and mismatch handling
- **Custom React hooks** (`useGameHost`, `useWorldTourHost`) encapsulating 800+ lines of game state management logic
- **Optimistic UI updates** with immediate visual feedback

### ⚔️ Territory Battle System
- **Transaction-based attacks** using Firestore `runTransaction()` to prevent race conditions
- **Mutual exclusion logic** preventing teams from being attacked while in active battles
- **Follower betting economy** with dynamic cost calculations (based on territory stars) and automatic refunds
- **Configurable cooldown periods** with live countdown displays on the HQ map
- **Home advantage mechanics** for defending teams (defender-specific rules per game)

### 🏆 Dynamic Ranking Algorithm
- **Multi-factor rank calculation**: Followers + Stars (territories owned) + Fan Favourites (world tour wins)
- **Weighted scoring formula**: `score = (followers × w1) + (stars × w2) + (fan_favourites × w3)`
- **Tiered progression system**: Rookie → Rising Star → Legend → Living Icon (top Legend)
- **Configurable thresholds** stored in database for runtime adjustments
- **Real-time rank updates** triggered automatically by game events

### 🌍 World Tour Challenge System
- **Formula-based scoring** with custom mathematical expressions using `hot-formula-parser`
- **Difficulty multipliers** (Normal 1x, Hard 2x, Extreme 3x) affecting final scores
- **Persistent leaderboards** with score history tracking per team
- **Fan Favourite achievements** automatically awarded to high score holders
- **Timer configurations** supporting both countdown and stopwatch modes

### 🗺️ Interactive SVG Territory Map
- **Custom coordinate parsing** supporting both rectangles and polygon shapes
- **Responsive bounds calculation** adapting to any screen size
- **Real-time status overlays** showing owner colors, battle indicators, and cooldown timers
- **Animated state transitions** with Framer Motion for visual feedback
- **Star rating display** with dynamic icon rendering

### ❓ Q&A Battle Mode
- **Question set management** with admin CRUD operations
- **Real-time question synchronization** between competing devices
- **Skip/next functionality** with index tracking to prevent repeats
- **Point-based scoring** tied to correct answer responses

### 🔐 Role-Based Access Control
- **Access code authentication** with Firebase Anonymous Auth
- **Protected route guards** with role-based permissions (Manager/HQ/Admin)
- **Dynamic team theming** with CSS custom properties applied at document root
- **Session persistence** with localStorage backup for page refreshes
- **Multi-team support** handling 6+ concurrent teams with unique color schemes
| Role | Access |
|------|--------|
| **Manager** | Team dashboard, attack territories, play games |
| **HQ** | Live game monitoring, leaderboard oversight |
| **Admin** | Full system configuration, team management |

### ⚙️ Comprehensive Admin Panel
- **Full CRUD operations** for Teams, Territories, World Tour Games, Locations, Question Sets
- **System configuration editor** for game rules, rank thresholds, and point weights
- **Blind box/gacha system** management for random rewards
- **Badge showcase** for rank badge visualization
- **Modal-based forms** with validation and real-time preview

### 📱 Progressive Web App
- **Offline-capable** with Vite PWA plugin and service worker caching
- **Installable** on iOS and Android devices via Add to Home Screen
- **Mobile-optimized viewport** with disabled zoom and touch gesture prevention
- **Apple touch icon** and web app manifest configuration

---

## 🛠️ Technical Highlights

| Category | Implementation |
|----------|----------------|
| **State Management** | React Hooks + Context API with Firestore real-time listeners |
| **Database Operations** | Firestore transactions for atomic updates and race condition prevention |
| **Authentication** | Firebase Anonymous Auth with code-based role assignment |
| **Real-Time Sync** | `onSnapshot()` subscriptions with optimistic UI updates |
| **Animations** | Framer Motion for page transitions and state changes |
| **Form Handling** | Controlled components with modal-based CRUD workflows |
| **Styling** | Tailwind CSS 4 with shadcn/ui component library |
| **Build Optimization** | Vite 7 with PWA plugin for service worker generation |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A [Firebase](https://firebase.google.com/) project with Firestore enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/outdoor-game-manager-app.git
   cd outdoor-game-manager-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the project root:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Initialize Firestore**
   
   Set up your Firestore database with the collections defined in [dbSchema.md](dbSchema.md):
   - `system_config` - Global game rules and rank thresholds
   - `teams` - Team profiles, followers, and statistics
   - `territories` - Territory data, game info, and live battle state
   - `world_tour_games` - World tour challenge definitions and leaderboards
   - `locations` - Physical location mappings with map coordinates

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint checks |

---

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin panel (13 components, CRUD modals)
│   ├── game/           # Game UI (15 components, scoreboards, modals)
│   ├── hq/             # HQ dashboard (territory map, leaderboards)
│   └── ui/             # Shared primitives (shadcn/ui, 23 components)
├── contexts/           # React context providers (AuthProvider)
├── hooks/              # Custom React hooks (16 hooks)
│   ├── useGameHost.js  # Territory game hosting (411 lines)
│   ├── useWorldTourHost.js  # World tour game logic
│   ├── useRank.js      # Team ranking calculations
│   └── useTeamData.js  # Team data subscriptions
├── lib/                # Utility functions
├── pages/              # Route page components (9 pages)
│   ├── Dashboard.jsx   # Manager's team dashboard
│   ├── Attack.jsx      # Territory attack selection
│   ├── HQ.jsx          # Live monitoring with SVG map
│   └── Admin.jsx       # System administration
└── services/           # Firebase service layer (5 services)
    ├── gameService.js  # Game state CRUD (478 lines)
    ├── challengeService.js  # Attack transaction logic
    ├── teamService.js  # Team operations
    └── rankService.js  # Ranking algorithm
```

---

## 🔥 Firebase Setup

### Firestore Security Rules

Ensure your Firestore rules allow appropriate read/write access based on user roles. See the Firebase documentation for [security rules best practices](https://firebase.google.com/docs/firestore/security/get-started).

### Indexes

Import the required indexes from `firestore.indexes.json`:
```bash
firebase deploy --only firestore:indexes
```

---

## 📱 Deployment

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Other Platforms

The production build (`dist/` folder) can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

---

## 📖 Documentation

- [Database Schema](dbSchema.md) - Firestore collection structures and field definitions

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private. All rights reserved.

---

<p align="center">
  Built with ❤️ for outdoor gaming enthusiasts
</p>
