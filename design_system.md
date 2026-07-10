# YoRHa OS Design System // Style Specifications

This document defines the colors, typography, layout grids, animations, and typography variables for the portfolio-blog project, inspired by NieR: Automata's tactical OS.

---

## 1. Color Palette

All colors are controlled dynamically via CSS variables mapped to `:root` and `:root.theme-dark`.

| Token | Light Theme (Default Beige) | Dark Theme | Purpose |
|---|---|---|---|
| `--nier-bg` | `#d1cdbc` | `#191815` | Main content panel background |
| `--nier-bg-alt` | `#c5c1b0` | `#24221d` | Sidebar, input panels, code container headers |
| `--nier-bg-overlay` | `rgba(209, 205, 188, 0.85)` | `rgba(25, 24, 21, 0.9)` | Full-screen interactive modal backdrops |
| `--nier-text` | `#4e4b42` | `#d1cdbc` | Primary reading typography |
| `--nier-text-muted` | `#8c887a` | `#8c887a` | Captions, stats, inline code block titles, code comments |
| `--nier-text-invert` | `#d1cdbc` | `#191815` | Text placed on inverse active buttons |
| `--nier-accent` | `#b04c3a` | `#d15645` | Highlights, delete actions, system warning headers |
| `--nier-accent-hover` | `#8f382a` | `#e57262` | Accent buttons hover state |
| `--nier-accent-dim` | `rgba(176, 76, 58, 0.15)` | `rgba(209, 86, 69, 0.2)` | Hover overlays, active list indicators |
| `--nier-border` | `#7f7c6e` | `#8c887a` | Solid thin borders, separation lines |
| `--nier-border-muted` | `#a3a092` | `#4a473e` | Inactive panel borders, separator borders |
| `--nier-grid-line` | `rgba(78, 75, 66, 0.05)` | `rgba(209, 205, 188, 0.04)` | Background layout dots |
| `--nier-scanline` | `rgba(78, 75, 66, 0.04)` | `rgba(209, 205, 188, 0.02)` | Animated linear scanline refreshes |

---

## 2. Typography

We import Google Fonts (`Share Tech Mono` and `Inter`) for clean, contrasting layouts.

- **Primary Sans Font**: `'Inter', sans-serif` (`var(--font-sans)`)
  - Used for standard readable paragraphs, summaries, lists, and editor descriptions.
- **Console Monospace Font**: `'Share Tech Mono', monospace` (`var(--font-mono)`)
  - Used for all headers (`h1-h6`), active navigation tabs, numerical statuses, code pre-blocks, button labels, and system status logs.
- **Header Formatting**:
  - Forced uppercase: `text-transform: uppercase`
  - Wide kerning: `letter-spacing: 0.08em`

---

## 3. Background Overlays & CRT Screen Effects

To mimic a retro-tactical screen:
1. **Background Overlay Dots (`.nier-grid-overlay`)**:
   - Generates repeating pattern dots:
     ```css
     background-image: radial-gradient(var(--nier-grid-line) 1px, transparent 1px);
     background-size: 20px 20px;
     ```
2. **Scrolling Scanline Refresh (`.nier-scanline-bar`)**:
   - An overlay bar moving vertically from top to bottom every 12 seconds:
     ```css
     animation: scan 12s linear infinite;
     @keyframes scan {
       0% { top: -100px; }
       100% { top: 100%; }
     }
     ```
3. **Screen noise filter (`.nier-noise`)**:
   - SVG-generated turbulence overlay rendering at opacity `0.015` to give a CRT screen feel.

---

## 4. Spacing System
- Thin borders: `1px solid var(--nier-border-muted)` or `2px solid var(--nier-border)`.
- Panel padding: standard `15px` to `25px`.
- Card shadow: `6px 6px 0px rgba(0,0,0,0.15)` offset block styling.
- Compact reading margins: `12px` to `18px` maximum spacing around items (the global `white-space: pre-wrap` is removed to guarantee natural paragraphs).
