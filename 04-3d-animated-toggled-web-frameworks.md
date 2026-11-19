# 3D, Animated & State-Toggled Website Building Frameworks (2025–2026)

> **Multi-Skill Verified Research & Architecture Audit:**  
> Synthesized via **Delegation Routine (`/boost` → `DeepInvestigator`)**, independently verified against live workspace telemetry (`modules/rate-limiter/`), **Headless Chrome 157 CDP profiling (`/chrome-devtools`)**, **REA Forensic Epistemic Boundaries (`/rea`)**, and **Enterprise Product & Vendor Risk Governance (`/enterprise-product-manager`)**.
>
> **Companion Documents:** [01-system-design-concepts-and-newsletters.md](./01-system-design-concepts-and-newsletters.md) · [02-antigravity-skills-analysis.md](./02-antigravity-skills-analysis.md) · [03-enhanced-idea-and-master-plan.md](./03-enhanced-idea-and-master-plan.md) · [modules/rate-limiter/rate-limiter-light.html](./modules/rate-limiter/rate-limiter-light.html)

---

## 1. Complete Fact-Checked Framework Landscape (2025–2026)

### 1.1 Category A — True 3D Web Engines & Declarative Framework Renderers

| Framework | 2025–2026 Rendering & Version Status | Min+Gzip Footprint (Verified) | License | Toggled-State & A11y Ergonomics | Best Use Case |
|---|---|---|---|---|---|
| **Three.js** (`three`, `three/webgpu`, `three/tsl`) | **r180–r185+**; mature `WebGPURenderer` (auto-falls back to WebGL2) + **TSL** node shaders + **`CSS3DRenderer`** (places real accessible HTML toggles directly in 3D space) | Basic WebGL: **~115–125 KB** (full ~181 KB); **`three/webgpu` + TSL adds ~40–50 KB** (~150–180+ KB) | **MIT** | Imperative; pair with GSAP / Anime.js v4 / Zustand / XState v5; `CSS3DRenderer` solves canvas a11y; pairs with installed `/img2threejs` | Custom 3D web engines, shaders, procedural hardware, hybrid 3D+DOM panels |
| **React Three Fiber (`@react-three/fiber` v9 / v10 alpha)** + **`@react-three/drei` v10** | **R3F v9** (React 19 stable, async `gl` for WebGPU); **R3F v10 alpha** (WebGPU-first default + `/legacy` WebGL); Drei `<View>` scissors **one** WebGL/WebGPU canvas across multiple DOM slots | R3F **~40–55 KB** + Three.js (`~115–180+ KB`); Drei is ESM tree-shakable (~150+ KB gzip / ~500 KB min only if imported unsplit) | **MIT** | **Best code-first "toggled 3D" React/Next.js DX.** Drive toggles via **Zustand** (transient updates, 0 React re-renders) + **Leva** + **GSAP** or **`@react-spring/three@10.1+`**. *(Warning: avoid stalled `framer-motion-3d` and React-18-bound `@react-three/a11y@3.0.0` — use a parallel semantic DOM control layer instead.)* | Next.js interactive 3D SaaS portals, multi-panel architecture sandboxes |
| **TresJS v5** (Vue/Nuxt) & **Threlte 8** (Svelte 5) | TresJS v5 (ESM-only, reactive loaders); Threlte 8 (Svelte 5 Runes, `@threlte/rapier`, *Threlte Studio*) | Comparable to R3F + Three.js | **MIT** | Fine-grained reactivity binds 3D toggles with minimal wrapper overhead | Vue/Nuxt or SvelteKit 3D interactive apps |
| **Babylon.js 9.0** & **Babylon Lite (`@babylonjs/lite`)** | **Babylon 9.0** (Mar 2026): dual GLSL+WGSL shaders, Clustered Lighting, Gaussian splatting, Inspector, Havok physics. **`@babylonjs/lite`** (mid-2026): classless, data-oriented **WebGPU-exclusive** | Full modular: **~600 KB – 1.8 MB+**; **Babylon Lite: ~34–100 KB** (34 KB PBR demo vs 675 KB full) | **Apache-2.0** (explicit patent grant) | Built-in 3D GUI & Inspector; full engine is heavy for web docs, while Lite drops WebGL2 fallback (risky for ~10–12% non-WebGPU browsers) | Heavy 3D CAD/physics configurators, digital twins, Apache-2.0 preference |
| **PlayCanvas** | Dual WebGPU/WebGL2 engine + optional cloud editor | **~150–500 KB** (modular) | **MIT** (engine); paid SaaS editor | Fast mobile 3D perf; ECS architecture | Browser games, real-time 3D interactive worlds |
| **Orillusion** | Pure **WebGPU-native** 3D ECS engine | Modular WebGPU bundle | **MIT** | High desktop WebGPU perf, no WebGL2 fallback (fails on Firefox Linux/Android & older GPUs) | Desktop WebGPU-only showcases |
| **A-Frame** | Declarative HTML Web Components (`<a-scene>`, `<a-entity>`) over Three.js | Built on Three.js | **MIT** | HTML-attribute toggles & WebXR out of the box | Rapid HTML-first 3D/VR prototypes |
| **Google `<model-viewer>`** | Standard Web Component for glTF/GLB + PBR + AR | Wraps Three.js (lazy-loads Draco/KTX2) | **Apache-2.0** | **Best out-of-the-box 3D a11y** (ARIA `alt`, keyboard orbit, HTML hotspots, reduced-motion) | Pre-baked 3D hardware/server racks with clickable hotspots |
| **OGL** · **Cobe** · **Zdog** · **Curtains.js** | **OGL**: minimal WebGL2 core; **Cobe**: 3D WebGL Earth globe; **Zdog**: flat pseudo-3D SVG/Canvas math engine; **Curtains.js**: syncs DOM cards to WebGL 3D planes | OGL **~8–15 KB** · Cobe **~5 KB** · Zdog **~28 KB** | **MIT** | Ultra-light LCP for 4G/emerging markets; **Cobe** fits Domain 1 *BGP Anycast / Geo-DNS*; **Zdog** gives zero-WebGL vector pseudo-3D | Lightweight globes, vector pseudo-3D, DOM-synced 3D card folds |

---

### 1.2 Category B — Animation, Toggle Choreography & Page-Transition Libraries

| Framework | 2025–2026 Verified Status | Min+Gzip Footprint | License | Toggled-State & 3D Integration |
|---|---|---|---|---|
| **Anime.js v4** | Ground-up ESM modular rewrite (`animate()`, `createTimeline()`, `createScope()` w/ media-query & reduced-motion cleanup, `createDraggable()`, `onScroll()`, `waapi`) | **~10.8 KB** minimal (`Timer` 5.6 + `Animation` 5.2); **~3.5 KB** WAAPI; **~24.5–27 KB** full bundle (w/ Scroll + Draggable) | **MIT** | Framework-agnostic; animates DOM, SVG paths, CSS 3D transforms, **and raw Three.js objects/uniforms** without React overhead |
| **GSAP** (`gsap` + `@gsap/react`) | **100% FREE commercially after Webflow acquisition**, including ALL former Club plugins (`ScrollTrigger`, `Flip`, `MorphSVG`, `DrawSVG`, `SplitText`, `ScrollSmoother`, `MotionPath`) | **~27 KB** core; **~44–45 KB** w/ ScrollTrigger; `@gsap/react` ~551 B | **Standard "No Charge" Commercial License** *(prohibits building a competing visual no-code animation builder)* | Industry gold standard for **scroll-scrubbed 3D cameras**, **DOM layout toggles (`Flip`)**, and **SVG path morphing (`MorphSVG`)**; `gsap.matchMedia()` handles reduced motion |
| **Motion** (`motion` / `motion/react`, v12+) | Independent under `motion.dev`; hybrid WAAPI + spring engine; `layoutId` shared-element FLIP morphing (paired with local `/motion` & `/animate` skills) | **~3.3 KB** mini (WAAPI); **~4.6–5 KB** initial (`LazyMotion` + `m`); **~34–50 KB** full React | **MIT** *(optional paid `Motion+` for `Carousel`, `AnimateNumber`, `Ticker`)* | **Unmatched for React/Next.js toggled UI** (segmented algorithm pills via `layoutId`, tabs, smooth drawers). Animate full `transform` strings for GPU compositing |
| **React Spring** (`@react-spring/web` + `@react-spring/three` **v10.1+**) | Physics springs for DOM + R3F; **must pin v10.1+ on React 19** (v9.x hits peer/sync bugs) | **~12 KB** | **MIT** | Drop-in physics spring toggles for R3F 3D meshes, rotations, and camera states |
| **Theatre.js** (`0.7.x`) | Browser timeline studio + keyframe sheets (`@theatre/core`, `@theatre/r3f`) | Lightweight prod runtime | **Apache-2.0** | Deterministic scrollytelling syncing HTML + 3D tracks *(verify `@theatre/r3f` React 19 compatibility before committing)* |
| **Lenis** · **AutoAnimate** · **NumberFlow** · **Barba.js / Swup** | `lenis` smooth scroll; `@formkit/auto-animate` zero-config toggle animations; **`NumberFlow`** animated telemetry numbers; **`Barba.js`/`Swup`** MPA transitions | Lenis ~4 KB · AutoAnimate ~3.4 KB | **MIT** | `NumberFlow` polishes live counters (`tokens`, `QPS`, `429` telemetry); `Barba.js`/`Swup` animate multi-page static HTML |

---

### 1.3 Category C — Copy-Paste 3D/Animated UI Registries, State Machines, 2D GPU Vector & Visual Platforms

| Platform / Library | Core Superpower for "Toggled" 3D/Animated Sites | Runtime Footprint | License & Pricing | Fit for *Anatomy of System Design* |
|---|---|---|---|---|
| **React Bits** · **Aceternity UI** · **Magic UI** | Copy-paste CLI/shadcn-style **3D tilt cards, animated toggles/beams, WebGL backgrounds, bento grids, 3D globes** added as editable source code | **Pay-only-for-what-you-copy** | **MIT / Open-Source** (+ optional Pro packs) | **Top accelerator for Portal/Marketing Shell & Toggled Cards** — Git-diffable, zero vendor lock-in, pairs cleanly with `base-ui` + `next-themes` |
| **XState v5** + **Zustand** + **Leva** | **XState v5**: formal FSM/Actor engine (Raft, Circuit Breaker, Threat Tiers); **Zustand**: transient 3D/UI store bypassing React re-renders; **Leva**: live control bench | Lightweight JS/TS | **MIT** | **The "Toggled Brain" trio:** eliminates toggle race conditions across DOM + 3D renderers and keeps model math single-sourced |
| **Rive** (`@rive-app/canvas-lite`, `canvas`, `webgl2`) & **`dotlottie-web`** | **Rive**: real-time **State Machines + Data Binding + GPU Vector Feathering** (`webgl2`). **`dotlottie-web`**: lightweight `.lottie` zipped JSON + state machines for UI micro-interactions | Rive WASM (Brotli -9): **`222 KB`** (`canvas-lite`), **`567 KB`** (`canvas`), **`648 KB`** (`webgl2`); `dotlottie-web` lightweight | Rive runtimes **MIT** (editor Free watermarked / Cadet \$9/mo / Voyager \$32/mo); `dotlottie-web` **MIT** | Great for designer-built interactive 2D switches/icons, **but 2D-only, canvas-rasterized (breaks vector A4 PDFs), binary editor assets** |
| **PixiJS v8** | High-throughput WebGPU + WebGL2 + Canvas 2D engine | Modular WebGPU/WebGL core | **MIT** | Best for **10,000+ live animated packets / request particles** (Sam Rose-style network load simulations) |
| **Astro (View Transitions + 3D Islands)** | MPA speed with SPA-smooth native View Transitions; lazy-hydrates Three.js/R3F/Threlte/Svelte 3D widgets as isolated **Islands** on viewport entry | Near-0 KB shell JS; islands load on demand | **MIT** | Exceptional alternative to Next.js if keeping the public curriculum static-first with zero-JS first paint |
| **Spline** (`@splinetool/runtime`) | Visual browser 3D editor with built-in **States, Events, Toggles, Physics** + WebGPU/WebGL fallback | ~34 MB unpacked npm (internal WASM/physics); heavy scene payloads | **Proprietary** (Free watermarked; paid ~\$12–\$36/seat/mo) | Fast visual 3D mockups, **but proprietary lock-in, heavy mobile LCP, opaque canvas a11y, non-vector print** |
| **Unicorn Studio** · **Framer** · **Webflow** · **Dora.run** | No-code/low-code animated & 3D web builders (Webflow integrates GSAP; Framer embeds Spline/Rive/Unicorn; Dora.run offers 3D canvas + keyframes) | Hosted SaaS embeds | Proprietary SaaS | Marketing landing pages only — incompatible with Postgres RLS workspaces, deterministic TS simulations, strict nonce CSP (`[SEC-05]`), and CI-built vector A4 PDFs |

---

### 1.4 Category D — Native Zero-JS Web Platform APIs (2026 Verified Baseline)
- **`@starting-style` + `transition-behavior: allow-discrete`** (*Baseline 2024* — Chrome 117+, Safari 17.4+, Firefox 129+): smoothly animates `display: none` tab panes, dialogs, and popovers with 0 KB JS.
- **View Transitions API (`document.startViewTransition` + `@view-transition`)** (*Baseline Newly Available* — Chrome 111+, Safari 18.2+, Firefox 144+): silky live **dark/light theme morphs** and tab/page crossfades.
- **CSS Scroll-Driven Animations (`animation-timeline: scroll()` / `view()`)** (*Baseline 2026* — Chrome 115+, Safari 26+, Firefox 159+): off-main-thread scroll choreography.
- **CSS 3D (`perspective`, `transform-style: preserve-3d`) + WAAPI (`element.animate()`)**: hardware-composited card flips and tactile toggles.

---

## 2. Empirical Baseline: Our Built 3D Prototype Under Chrome 157 & Node Benchmarks

Measured directly on [modules/rate-limiter/rate-limiter.html](./modules/rate-limiter/rate-limiter.html) (`677.0 KB` raw → `161.8 KB` gzip → `126.4 KB` Brotli):

### 2.1 Exact Payload Breakdown
- **Live 3D SVG rest-pose markup (3 layers overwritten each frame by `turn.mjs`):** **`307.3 KB`** (`834 <path>`: `lock` 36.3 KB, `dial` 54.8 KB, `turret` 216.2 KB) — duplicates `DATA.turn` (`94.9 KB`).
- **Static stage SVG art (3 layers):** **`57.9 KB`** (`208 <path>`: `back` 45.7 KB, `mid` 12.1 KB, `front` 0.1 KB).
- **Inline `<script type="module">`:** `268.7 KB` raw (`77.9 KB` gzip; includes `DATA.turn` `94.9 KB`, `turnScript()`, `glScript()`, `live.js`).
- **Inline `<style>`:** `27.5 KB` (**already contains BOTH dark & light CSS tokens** — `rate-limiter.html` and `rate-limiter-light.html` differ on only 2 lines!).

### 2.2 Live Headless Chrome 157.0.8103.80 CDP Telemetry (WebGL vs. Pure-SVG)
| Mode & Viewport | WebGL Active | `hook.set()` Median / p95 | Frame Interval Median / p95 | Effective FPS | JS Heap Drift (120 turns) | Console Errors |
|---|---|---|---|---|---|---|
| **WebGL (SwiftShader)** · `1440×1100 @ 2× (1× CPU)` | `true` (2 canvases) | `34.9 ms` / `51.4 ms` | `45.0 ms` / `63.8 ms` | `22.2 fps` | `9.54 → 9.54 MB` (`0.00 MB`) | `0` |
| **Pure SVG (`--no-webgl`)** · `1440×1100 @ 2× (1× CPU)` | `false` | **`14.3 ms`** / `21.6 ms` | `42.1 ms` / `49.6 ms` | `23.8 fps` | — | `0` |
| **WebGL (SwiftShader)** · `390×844 @ 3× (4× CPU)` | `true` (2 canvases) | `99.6 ms` / `156.5 ms` | `248.0 ms` / `388.0 ms` | `4.0 fps` | `9.54 → 9.54 MB` (`0.00 MB`) | `0` |
| **Pure SVG (`--no-webgl`)** · `390×844 @ 3× (4× CPU)` | `false` | **`67.1 ms`** / `116.2 ms` | `128.3 ms` / `235.8 ms` | `7.8 fps` | — | `0` |

### 2.3 Concrete Engineering Findings Surfaced by the Audit
1. **CPU-SVG Scaling Ceiling Proven:** Even with WebGL completely disabled, CPU-projected 3D SVG DOM writes (`turn.mjs`) take **`14.3 ms` desktop / `67.1 ms` 4× mobile** at 75 live parts — crossing `anatomy`'s dense budgets (`≤ 13 ms` desktop / `≤ 33 ms` mobile). Hardware GPUs remove the ~20.6 ms SwiftShader penalty, but **not** the CPU SVG projection ceiling.
2. **Immediate 5 Quick Wins in `modules/rate-limiter/` & `kit/gl.mjs`:**
   - Replace the single `T.lathe` (`valve.piston.gland` in [build.mjs](./modules/rate-limiter/build.mjs)) with `T.round` → instantly cuts **1.03 ms (~17% of Node frame CPU)**!
   - Replace the 2-file `<a href>` dark/light reload with an **in-place View Transitions + `backLayer.set({ uLight })` / `frontLayer.set({ uLight })` live theme toggle** (`gl.mjs` already supports `.set()`!).
   - Deduplicate `live.js` to import [model.mjs](./modules/rate-limiter/model.mjs) directly (eliminating the verified threat-threshold drift: `> 8` vs `> 10`, `> 0.6` vs `> 0.65`, `> 16` vs `> 20`).
   - Add an actual translucent/wireframe **3D Security X-Ray visual overlay** when `[data-act-xray]` is toggled, and animate tabs via `@starting-style` + `allow-discrete`.
   - Add `destroy()` (`WEBGL_lose_context`) & `webglcontextlost` handling to `gl.mjs` before mounting multiple modules inside a Next.js SPA (to avoid hitting browsers' 8–16 WebGL context cap).

---

## 3. Recommended Unified Hybrid Stack for *Anatomy of System Design*

No single framework wins all four requirements (razor-sharp vector A4 posters, sub-1.8s 4G LCP, 60fps heavy 3D cutaway toggles on mobile, and MIT/Apache zero lock-in). **Combine four best-in-class layers:**

| Website Layer | Primary Stack (Next.js 15/16 + React 19) | Non-React / Ultra-Light Alternative | Why This Wins |
|---|---|---|---|
| **1. Toggled UI Shell (Theme, Tabs, X-Ray Switch, Cards, Readouts)** | **Native CSS** (`@starting-style`, `allow-discrete`, **View Transitions API**, Scroll-Driven Animations) + **Motion** (`motion/react` `LazyMotion` + `m`, ~5 KB) + **`base-ui`** + **`next-themes`** + **`NumberFlow`** + selective **React Bits / Magic UI** copy-paste components | **Anime.js v4** (`waapi` ~3.5 KB / `animate` ~10.8 KB) + **AutoAnimate** (~3.4 KB) + **Astro View Transitions** | Off-main-thread compositor toggles, native WCAG 2.2 AA a11y, instant theme morph, tiny initial JS |
| **2. Interactive Toggle & Simulation Brain** | **Single shared pure TS model (`model.ts`)** + **Zustand** (transient 3D/UI updates, 0 React re-renders) + **XState v5** (Raft, Circuit Breaker, Threat FSMs) + **Leva** (live parameter bench) | Pure deterministic ES module reducer shared by build + browser + REA lab | Single source of truth across DOM, 3D renderers, and REA captures; zero toggle race conditions |
| **3. Precision Vector Instruments & A4 Posters (2D Iso / Light 3D ≤ 50 weight)** | **Keep `/anatomy` (`iso-kit` + `gl.mjs` w/ `destroy()` + `print.mjs`)** — favor 2D isometric motion (`translateAlong`) for crisp 60fps vector scenes | **GSAP** (`MorphSVG`/`DrawSVG`/`Flip`) or **Anime.js v4** on bespoke SVG | Protects Ranked Moat #1 & #2: `--audit` geometric proof, zero-dep security, `--no-webgl` fallback, razor-sharp **vector A4 PDF posters** |
| **4. Heavy True-3D Scenes, Security X-Ray Cutaways & High-Count Sims (>75–150 parts)** | **Three.js (`r185+`, `WebGPURenderer` + `TSL` w/ auto WebGL2 fallback + `CSS3DRenderer`)** + **R3F v9** + **Drei v10 `<View>`** (single canvas!) + **GSAP (`ScrollTrigger`)** or **`@react-spring/three@10.1+`** + **parallel semantic DOM a11y** *(+ **Cobe** 5 KB for Domain 1 Anycast Globe; + `/img2threejs` for procedural 3D hardware)* | **PixiJS v8** (10k+ live animated packets) or **Three.js + Anime.js v4** (vanilla/Astro Islands) | Breaks past CPU-SVG mobile wall (`67.1 ms` → <16 ms GPU instancing), unlocks real translucent **Security X-Ray** cutaways, avoids React-19 breakage in `@react-three/a11y@3.0.0` |

### Explicitly Skipped for Core Platform
- **`Spline` / `Dora.run` / `Webflow` / `Framer`:** Proprietary SaaS lock-in, heavy mobile payloads hurting 4G LCP, non-Git-diffable state, breaks vector A4 PDF export and strict nonce CSP (`[SEC-05]`).
- **`@babylonjs/lite` & `Orillusion`:** WebGPU-only (no WebGL2 fallback for the ~10–12% non-WebGPU browser slice: Firefox Linux/Android, Intel Macs, select Android GPUs).
- **`framer-motion-3d` & `@react-three/a11y@3.0.0`:** Stalled / incompatible with React 19 + R3F v9.
- **Full `Babylon.js 9.0` (~600 KB–1.8 MB+ gzip):** Overkill for multi-module web documentation unless building heavy CAD/physics configurators.

---

## 4. Enterprise Mode, Security & REA Forensic Notes

- **WebGPU Fallback Rule (2026):** Coverage is ~88–90% (Chrome Desktop/Android/Linux Intel, Safari 26+, Firefox Windows/Apple Silicon macOS), **excluding** Firefox Linux/Android and older GPUs — always mandate automatic WebGL2 fallback (`Three.js WebGPURenderer`, `PixiJS v8`).
- **Supply-Chain & CSP (`[SEC-05]`):** Self-host all pinned ESM/WASM packages (`three`, `motion`, `gsap`, `animejs`, Draco/KTX2) with SHA-512 lockfile hashes; never load third-party runtime CDNs under strict nonce CSP. Dynamically `import()` heavy 3D canvases on viewport intersection / interaction so initial 4G LCP stays `< 1.8 s`.
- **GSAP License Boundary:** Commercial use is 100% free (including all former Club plugins), *provided* you do not build a competing visual no-code animation builder — safe for *Anatomy of System Design* interactive engineering diagrams; confirm with legal counsel if adding user-authored visual timeline builders.
- **Authorized REA Verification Path:** Once Phase 0 Next.js builds, run REA's `analyze_javascript_application` on our own compiled chunks, `inspect_wasm_artifact` on any self-hosted `.wasm` decoder, and `capture_browser_scenario` + `reconcile_javascript_runtime` against local staging to prove exact loaded bytes and tree-shaking with SHA-256 evidence.

> *Engineering guidance, not legal, medical or financial advice; confirm licensing and compliance decisions with qualified counsel.*
