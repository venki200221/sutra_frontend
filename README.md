# Sutra — Interactive 3D Pitch Website

A single-page, scroll-driven 3D marketing site that walks a prospect through a B2B
operations platform's full wholesale loop:

**Inventory & Item Selection → Quote & Approval → Place Order → Payment → Invoice &
Inventory Update → Delivery**, with **Resource Management** as a parallel track and a
**Backend Control Room** floating above it all.

One persistent low-poly 3D scene sits behind the page. As you scroll, the camera flies
station-to-station along a color-coded flow path that draws itself in. At **Payment**
the path **forks three ways in 3D** — paid in full (green), advance with balance due
(amber), full credit (rose) — and all three strands **merge into the Invoice**, which
records the payment status and auto-updates stock. Every stage pops an
**auto-notification toast**. The indigo control-room droplines land last: the backend
touches everything.

**Stack:** Vite · React 18 · three.js via @react-three/fiber + drei · GSAP ScrollTrigger · Lenis · Tailwind CSS

---

## Quick start

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/ (deploy to any static host)
npm run preview    # serve the production build locally
```

> **Authoring note:** this project was generated in a sandbox without npm registry
> access, so `npm install` + `vite build` have not been executed yet — run them as
> your first step. The source tree passed offline verification (syntax balance,
> import/export resolution audit via `scripts/audit_src.py`, `node --check` on all
> plain-JS modules) and all eight GLBs are spec-validated. If anything trips at build
> time it will be trivial (a typo-level fix), not structural.

Deploying under a sub-path (e.g. GitHub Pages)? Set `base: '/your-repo/'` in
`vite.config.js` — asset URLs already respect `import.meta.env.BASE_URL`.

---

## The color system ("colorful light dashboard")

Each stage owns a color used consistently across its 3D path segment, anchor dot,
rim light, panel top bar, step chip, bullets and notification toast:

| Stage | Color | | Stage | Color |
|---|---|---|---|---|
| 01 Inventory | teal `#14B8A6` | | 05 Invoice | blue `#3B82F6` |
| 02 Quote | amber `#F59E0B` | | 06 Delivery | orange `#F97316` |
| 03 Order | violet `#8B5CF6` | | 07 Resources | pink `#EC4899` |
| 04 Payment | green `#22C55E` | | 08 Backend | indigo `#6366F1` |

Payment outcomes reuse three tones everywhere (3D strands, outcome cards, invoice
chips): green = paid in full, amber = advance/balance due, rose = credit.
Small text always uses the darkened variants (AA on white); vivid values are reserved
for graphics, chips and large elements. Backdrop: white with soft color auras + a
faint dot grid (the "backend ledger" texture).

## Project structure

```
index.html                  meta/title (rebrand here too)
model-preview.html          standalone QA viewer for the GLB assets (open in browser)
public/models/*.glb         ← the eight placeholder models — SWAP THESE
scripts/
  generate_models.py        regenerates placeholder GLBs (stdlib-only, no deps)
  audit_src.py              offline source audit used during authoring
src/
  config/site.js            product name, tagline, demo link  ← rebrand here
  content/nodes.js          ★ single source of truth: stage copy, colors, toasts,
                              3D positions, camera poses, path geometry
  lib/scrollState.js        scroll → continuous "stop" coordinate (0..10)
  lib/smoothScroll.js       Lenis + ScrollTrigger integration
  lib/panelReveal.js        scrubbed panel + toast reveal (+ reduced-motion fallback)
  hooks/useMediaQuery.js    prefers-reduced-motion / mobile hooks
  scene/
    Experience.jsx          persistent <Canvas>, asset preloading
    CameraRig.jsx           pose-to-pose camera flight with dwell easing
    FlowPath.jsx            data-driven colored segments: fork, merge, droplines
    NodeModel.jsx           GLB loader: idle float, focus scale, blob shadow
    Lights.jsx              studio lighting + stage-colored traveling rim light
  ui/                       Header, Hero, NodeSection, Recap, Cta, LoadingOverlay
  App.jsx                   layering + backdrop + scroll systems bootstrap
```

## How the scroll experience works

The page is measured in **stops**: `0` hero · `1–8` stages · `9` recap · `10` CTA.
Each section declares `data-stop="n"`; `scrollState.js` converts live scroll position
into a continuous coordinate (e.g. `4.5` = halfway from payment to invoice). Every frame:

- **CameraRig** blends between neighboring stop poses with a `dwell()` plateau, so the
  camera rests at each station and glides between them — fully reversible with scroll.
  The control room (stop 8) uses a custom elevated pose looking down over the flow.
- **FlowPath** maps the coordinate to `drawRange` on each tube segment (see the
  `window` values in `content/nodes.js`): main segments complete stage by stage, the
  three payment strands draw staggered during the payment dwell and merge at the
  invoice, the resource lane draws on approach to stop 7, and the indigo droplines
  land at stop 8.
- **NodeModel** scales the nearest model up ~1.15× and floats everything gently;
  **Lights** moves a rim light onto the active model and tints it that stage's color.
- **panelReveal.js** runs one scrubbed GSAP timeline per section — panel in at 16–36%
  of section progress, notification toast pops at ~31%, hold, out at 64–82% — so
  exactly one panel is visible at a time.

**Reduced motion** (`prefers-reduced-motion`): Lenis and all scrubbing are skipped;
panels fade via CSS + IntersectionObserver; the camera snaps to the nearest stop; idle
float, rotation and the toast ping are disabled.

**Responsive / all devices:** full-height sections use `svh` viewport units (mobile
URL-bar safe, `.h-viewport` in index.css); DPR is clamped to 1.5 on mobile; the camera
pulls back with no lateral offset; panels dock to the bottom and scroll internally on
short screens; hero/CTA type scales per breakpoint, buttons go full-width on phones and
the hero legend collapses below `sm`. The hero and closing CTA sit on glassmorphism
panes (`.glass-card`: backdrop blur + saturation, iOS `-webkit-` prefixed).

## Swapping the placeholder models

Drop your GLB into `public/models/` with the same filename (`inventory.glb`,
`quote.glb`, `order.glb`, `payment.glb`, `invoice.glb`, `delivery.glb`,
`resource.glb`, `console.glb`).

- Author each model roughly **1.6–2 units tall/wide, centered at the origin** —
  positioning/floating/shadows are handled by the app.
- Open **`model-preview.html`** in a browser to sanity-check assets (orbit controls).
- Regenerate the placeholders anytime: `npm run models:generate` (pure-Python, no deps).
- Once you use heavier assets, compress them: `npm run models:optimize`
  (gltf-transform + Draco), and enable Draco decoding by passing `true` as the second
  argument to `useGLTF` in `src/scene/NodeModel.jsx`.

## Editing copy & tuning feel

- All stage copy, colors and toasts live in `src/content/nodes.js`; brand/tagline in
  `src/config/site.js`.
- Dwell length: `dwell()` in `src/lib/scrollState.js` (0.3/0.4/0.3 split).
- Camera tightness: `DAMP` in `CameraRig.jsx` (higher = more glued to scroll).
- Time at each station: section heights (`h-[170vh]`) in `NodeSection.jsx`.
- Panel/toast timing: `inAt` / `outAt` fractions in `lib/panelReveal.js`.
- Path choreography: per-segment `window` values in `content/nodes.js`.

## Accessibility

- Body text `#6B6B76` on white ≈ 5.2:1 (AA); colored small text always uses each
  stage's darkened variant (≈4.5:1+); vivid stage colors are decoration/large-text only.
- Gradient CTA uses teal-600 → violet-600 under white text (both stops AA).
- All CTAs are real links/buttons with visible `:focus-visible` rings.
- Canvas is `aria-hidden`; sections are labelled; the recap diagram has a full text
  description via `role="img"` + `aria-label`; the toast ping animation is disabled
  under reduced motion.
