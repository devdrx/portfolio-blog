# YoRHa Tactical OS // Portfolio & Blog

A premium retro-futuristic portfolio-blog inspired by **NieR: Automata's YoRHa tactical OS**. It features custom visual components, procedural audio synthesis, lightweight routing, and a comprehensive admin management console.

---

## 1. Core Feature Set

The application is split into public pages (Tabs `01` to `04`) and a hidden administrative maintenance shell:

*   **Tactical Connection Boot Screen (`BootScreen.tsx`):**
    *   Pre-connection portal that mimics the tactical synchronization console.
    *   Displays progressive diagnostic boot log strings with sound notifications.
    *   Bypasses the browser's audio autoplay restrictions by capturing the initial user interaction (`[ INITIATE CONNECTION ]`) to resume the `AudioContext` timeline.
*   **Cinematic Page Transitions (`AirlockTransition.tsx`):**
    *   Features sliding blast doors, engaging mechanical locking bolts, system loading screens, white CRT static flashes, and page reveals.
    *   Saves state in `sessionStorage` to trigger a shorter, expedited animation sequence on repeat navigation.
    *   Integrates native browser telemetry variables to automatically fall back to simple CSS fades if the user prefers reduced motion.
*   **System Overview & Dashboard (`Home.tsx` // `01_HOME`):**
    *   Displays active unit profile specifications, diagnostic check status lists, and system resource CPU load indicators.
    *   Loads and maps public featured projects list.
    *   Pulls profile data dynamically from the system backend configurations.
*   **SoundCloud Jukebox & Arpeggiator (`ArtWeeb.tsx` // `02_ART`):**
    *   **SoundCloud Proxy Module:** Fetches real-time profile stats, track details, and favorite likes using a backend SoundCloud API proxy.
    *   **Procedural Synth Sequencer:** A 4-step arpeggiator that allows scheduling custom audio notes over a high-precision clock queue.
*   **Markdown & LaTeX Blog Engine (`Blog.tsx` // `03_BLOG`):**
    *   Compiles Markdown body content, LaTeX math formulas, and code block formatting.
    *   Includes custom code block containers with click-to-copy headers.
    *   Provides Category filtering tags and search string query parameters.
*   **System Settings & Diagnostic Console (`SystemSettings.tsx` // `04_SYSTEM`):**
    *   Controls volume calibration parameters and visual mode toggles (Light/Dark themes, Scanline animations).
    *   Provides visual database operations (Factory reset, backup export, and import config bundles).
    *   Exposes a system logs stream panel that updates dynamically with user actions.
*   **Administrative Maintenance Console:**
    *   **Access Triggers:** Triggered by typing the sequence `"access yorha"` anywhere on the public page, or using the keyboard shortcut `Ctrl+Shift+A`.
    *   **Maintenance Dashboard:** Displays live health statuses, total size summaries of media directories, post/draft counts, and backup logs.
    *   **Posts Editor:** Full CRUD interfaces to draft, edit, preview, compile, publish, and delete blog posts. Supports bulk publishing and bulk deletion.
    *   **Projects Panel:** Admin CRUD panel to manage, sort, hide/show, and add github/demo links for portfolio projects.
    *   **Media Gallery:** File-uploader backing system. Uploads raw binary assets, displays images, copy-pastes visual URLs, and wipes media nodes.
    *   **Logs Console:** Renders system event logs logged by the backend.

---

## 2. Technical Implementation & Architecture

### A. Procedural Audio Synthesizer (`SoundController.ts`)
All sound effects are procedurally generated using the native browser **Web Audio API** (sine/sawtooth/square oscillator nodes, gain envelopes, noise buffer filters). No external audio files (`.mp3` or `.wav`) are loaded.
The music arpeggiator arpeggiates notes utilizing a **150ms lookahead scheduler queue**. This schedules notes slightly ahead on the Web Audio clock to avoid standard JavaScript timer freezes when switching browser tabs.

### B. Custom Router & Navigation (`App.tsx`)
A lightweight routing shell is built using React component state synced with window `hashchange` events (e.g., `/#home`, `/#art`, `/#/admin/login`). This provides full URL synchronization and back/forward browser history support.

### C. Backend API Server (`server/index.js`)
An Express.js server runs as the backend, serving:
*   REST API endpoints for post, project, configuration setting, and logging operations.
*   A SoundCloud proxy client to fetch profile metadata and liked tracks.
*   Multer middleware configured to store physical binary media assets directly under the local uploads directory.

### D. Data Persistence & Authentication
*   **Database:** Standard JSON flat files are used as the backend database (`server/data/*.json`). The server reads/writes formatting using Node.js `fs` serialization.
*   **Authentication:** Utilizes `bcryptjs` on the client-side to verify initial administrator credentials (`admin` / `yorha-admin`). Successful sessions generate a base64 encoded JWT simulation payload stored inside `sessionStorage`.

---

## 3. Technology Stack

*   **Frontend:**
    *   React 19 (Hooks, custom elements)
    *   TypeScript 6 (Type safety contracts)
    *   Vite 8 (Build tool, HMR dev server)
    *   Vanilla CSS (CSS Custom Variables, keyframe animations, grid overlays, no Tailwind)
    *   Lucide React (HUD interface icon markers)
    *   Marked + KaTeX + Highlight.js (Markdown parsing, LaTeX math equations, code blocks formatting)
*   **Backend:**
    *   Node.js (API environment runtime)
    *   Express 5 (Routing middleware, REST API layers)
    *   Multer (Multipart binary file parser)
    *   Bcryptjs (Cryptographic helper for password checks)
    *   Concurrently (Simultaneous frontend & backend startup script runner)

---

## 4. Current Limitations & Constraints

*   **Local JSON-File Database:**
    The backend uses local files (`server/data/*.json`) to persist state. It does not use a production-grade database system (such as PostgreSQL, SQLite, or MongoDB). Consequently, concurrent backend writes may result in race conditions or lost data updates.
*   **Unauthenticated API Endpoints:**
    While the frontend checks `sessionStorage` tokens in administrative views, the backend Express API does not enforce token checking. Endpoints (such as `POST /api/posts` or `DELETE /api/media/:id`) can be queried by anyone with network access.
*   **Mock Session Security:**
    Sessions are verified via client-side base64 JWT simulation strings. Initial admin credentials (`admin` / `yorha-admin`) are seeded locally into the browser’s `localStorage`.
*   **SoundCloud API Client Key dependency:**
    SoundCloud statistics and track arrays require a valid `SOUNDCLOUD_CLIENT_ID` in the server's `.env`. If the client ID is missing or invalid, the jukebox likes widget will return service error messages.
*   **Single-User Focus:**
    The system is designed for single-operator administration. Multiple concurrent admins are not supported by the local session system.

---

## 5. Getting Started

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm

### Installation
1. Install dependencies:
    ```bash
    npm install
    ```
2. Copy the environment variables template and configure your parameters:
    ```bash
    cp .env.example .env
    ```
    *(Note: Add your custom `SOUNDCLOUD_CLIENT_ID` inside `.env` to enable Jukebox tracks.)*

### Run Environment
*   **Development mode (Frontend & Backend concurrently):**
    ```bash
    npm run dev:full
    ```
*   **Build production package:**
    ```bash
    npm run build
    ```
*   **Run linter check (Oxlint):**
    ```bash
    npm run lint
    ```
