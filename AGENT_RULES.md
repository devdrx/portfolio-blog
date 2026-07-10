# Agent Rules // Coding Conventions & Standards

This document establishes the guidelines, coding conventions, folder mapping rules, and architectural constraints for any AI agent pair programming on this codebase.

---

## 1. Directory & Component Mapping

All files must align with the folder structure:
- **`src/components/`**: Reusable component UI logic (such as boot sequences, glitches, sound interfaces). Keep components focused, self-contained, and modular.
- **`src/pages/`**: Primary page screens. Must map directly to the navigation shell:
  - `Home.tsx`: User profile logs and checklist grids.
  - `ArtWeeb.tsx`: Jukebox arpeggiator clock and media frames.
  - `Blog.tsx`: Database archive files, search, filtering, and editing.
  - `System.tsx`: Calibration settings (sound level, mode toggler).
- **`src/index.css`**: Main layout stylesheets. Style adjustments must be written here or inside clean, scoped inline style objects matching standard variables.

---

## 2. Core Architectural Conventions

### A. Procedural Audio Synthesizer
- Sound effects must be procedurally generated. Do not load `.mp3` or `.wav` media.
- Sound trigger triggers:
  - Tab navigation, action selects, backups: `Sound.playClick()`
  - Settings hover toggles, option modifications: `Sound.playHover()`
  - Saved database entries, successful compilations: `Sound.playChime()`
  - System warnings, delete prompts, validation errors: `Sound.playWarning()`
- To bypass browser block restrictions, ensure the user interaction state is validated on boot.

### B. Lightweight Hash Routing
- Track location changes via window hash state listeners.
- Nav tabs are index-aligned: `01_HOME`, `02_ART`, `03_BLOG`, `04_SYSTEM`. Keep links in routing lists synced to their hashes (`/#/`, `/#/art`, `/#/blog`, `/#/system`).

### C. Markdown, LaTeX, and Syntax Rendering
- Render all user-composed markdown text through `renderMarkdownToHtml`.
- Mount HTML safe segments using React `dangerouslySetInnerHTML`.
- Do not apply `white-space: pre-wrap` on parent content wrappers; standard HTML structures handle block positioning natively.

---

## 3. Do's and Don'ts

### DO's
- **DO** keep styling consistent with the color variables in `design_system.md`.
- **DO** run `npm run build` in the terminal to verify the package compiles cleanly before concluding.
- **DO** capture browser subagent screenshots to confirm layout visual state changes.
- **DO** write clean JavaScript string templates and encode them (`encodeURIComponent`) when passing text inside DOM event listeners.

### DON'Ts
- **DON'T** import Tailwind CSS.
- **DON'T** use generic browser dialogue functions (`alert()`, `confirm()`); use custom modal overlays.
- **DON'T** implement line-by-line regex split mapping loops for markdown rendering; use the unified KaTeX/Highlight.js parser library chain.
- **DON'T** write background loop timing clocks with unstable `setInterval` loops (which freeze in background browser tabs); queue notes directly on the high-precision Web Audio clock.
