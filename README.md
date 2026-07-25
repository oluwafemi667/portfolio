# Portfolio v3

Personal portfolio site for Oluwafemi Ajayi, built as a static Vite + Three.js
project (no framework). Features a procedural, noise-displaced glass sculpture
in the hero with bloom post-processing and cursor-reactive lighting, GSAP
scroll animations, and a fully custom design system.

**Live site:** [ajayioluwafemi.netlify.app](https://ajayioluwafemi.netlify.app)

## Tech stack

- **Build tool:** Vite
- **3D:** Three.js (procedural geometry, `MeshPhysicalMaterial`, `UnrealBloomPass`, `RoomEnvironment`)
- **Animation:** GSAP + ScrollTrigger
- **Styling:** Plain CSS, no framework
- **Forms:** Netlify Forms
- **Hosting:** Netlify, auto-deploys from `main`

## Running locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Building for production

```bash
npm run build
```

Outputs to `dist/`. This is also what Netlify runs on every push to `main`
(Build command: `npm run build`, Publish directory: `dist`).

## Project structure

```
├── index.html          # page structure and copy
├── src/
│   ├── main.js          # hero scene, cursor, scroll reveals, form handling
│   └── style.css        # design system (tokens, layout, components)
├── public/
│   ├── photo.png
│   ├── favicon.ico
│   ├── payflow-preview.svg    # placeholder, swap for a real screenshot
│   ├── mamaspace-preview.svg  # placeholder, swap for a real screenshot
│   └── Oluwafemi_Ajayi_Resume.docx
└── vite.config.js
```

## Still open

- Replace the two project preview SVGs in `public/` with real screenshots
  of PayFlow AI and MamaSpace.
