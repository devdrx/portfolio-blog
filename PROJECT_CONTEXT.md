# Project Context // YoRHa OS v1.0.9 Hand-off

This document acts as a comprehensive context hand-off for subsequent AI agents. It maps the project structure, architectural choices, and feature sets of this portfolio-blog.

---

## 1. Project Overview & Aesthetic
- **Design Inspiration**: NieR: Automata's YoRHa tactical OS.
- **Visual Palette**: Warm sand-beige default theme (`--nier-bg: #cdcbbf`), dark-grey contrast accents, pixel-aligned thin borders, scanning CRT animation lines, dotted background overlay grids, and monospace typography (`Share Tech Mono` and `Inter`).
- **Framework Constraints**: React + Vite + TypeScript + Vanilla CSS (No Tailwind or heavy UI component frameworks).

---

## 2. File Structure Map

```
portfolio-blog/
├── index.html                   # HTML Entry (Google Fonts imports, CRT scanline overlay divs)
├── src/
│   ├── main.tsx                 # React App bootstrapper
│   ├── App.tsx                  # Hash Router, theme toggler, and navigation shell (01-04 tabs)
│   ├── index.css                # Global YoRHa design tokens, CRT animations, KaTeX/Highlight.js styling overrides
│   ├── components/
│   │   ├── BootScreen.tsx       # Pre-connection splash panel (unlocks AudioContext via user interaction)
│   │   ├── GlitchText.tsx       # Cybernetic mechanical character reveal glitches
│   │   └── SoundController.ts   # Synthesizer module (generates hover, click, chime, alarm tones using Web Audio API)
│   └── pages/
│       ├── Home.tsx             # [01_HOME] User bio logs, system diagnostic panels, and tactical checklists
│       ├── ArtWeeb.tsx          # [02_ART] Procedural jukebox (lookahead clock scheduler) and media gallery
│       ├── Blog.tsx             # [03_BLOG] Markdown knowledge archives, LaTeX renderer, custom edit/delete flows
│       └── System.tsx           # [04_SYSTEM] Volume adjustments, theme controllers (Light/Dark), database controls
```

---

## 3. Core Component & Feature Mechanics

### A. Procedural Sound Synthesizer (`SoundController.ts` & `BootScreen.tsx`)
- **Web Audio API**: Procedurally synthesizes sound effects (synthesized clicks, success chimes, alert warnings) to bypass the browser's autoplay block policy.
- **Connection Splash**: `BootScreen.tsx` blocks access until the visitor clicks `[ INITIATE CONNECTION ]`, capturing a user gesture to resume the `AudioContext` timeline.

### B. Lightweight Hash Routing (`App.tsx`)
- Handles page changes via url hash states (`/#/`, `/#/art`, `/#/blog`, `/#/system`) with event listeners synced to browser back/forward buttons, maintaining tab memory.

### C. Jukebox Timeline Clock (`ArtWeeb.tsx`)
- Standard JavaScript `setInterval` throttles on tab changes. The arpeggiator uses a **150ms lookahead timeline queue** that schedules node triggers ahead of time on the high-precision Web Audio clock.

### D. Upgraded Markdown & LaTeX Compiler (`Blog.tsx`)
- **Block-Level Compiler**: Replaced raw splitting loops with `marked` (Markdown layouts), `katex` (formula renderer), and `highlight.js` (code highlight tokenization).
- **Custom Renderers**: Overrides marked code frames with custom copy buttons (`decodeURIComponent` click handlers with promise error catches) and YoRHa-styled syntax variables inside `index.css`.
- **Dynamic Merging**: Merges new default entries into existing local storage cache layers without losing custom posts.
- **Search & Filters**: real-time filter chips and search query text fields.
- **Edit & Custom Modals**: Supports full editing of posts and maps deletes to a custom overlay popup.
