# Portfolio v3

Personal portfolio site for Oluwafemi Ajayi, built as a static Vite project
(no framework). It has a procedural, noise-displaced glass sculpture in the
hero, GSAP scroll animations, and a custom design system.

**Live site:** [ajayioluwafemi.netlify.app](https://ajayioluwafemi.netlify.app)

## Tech stack

- **Build tool:** Vite
- **3D:** Three.js (procedural geometry, `MeshPhysicalMaterial`, `UnrealBloomPass`, `RoomEnvironment`)
- **Animation:** GSAP + ScrollTrigger
- **Styling:** Plain CSS, no framework
- **Forms:** Netlify Forms, submitted in the background with a honeypot
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

## Performance notes

- Three.js lives in `src/hero.js` and is loaded after first paint, so the main
  bundle stays small and the page is readable before the 3D scene starts.
- The hero stops rendering when it is off screen or the tab is hidden.
- On narrow screens the sculpture is smaller and lower in detail, and bloom is skipped.
- Cursor, tilt and magnetic effects only run on devices with a mouse.

## Project structure

```
├── index.html          # page structure and copy
├── src/
│   ├── main.js          # cursor, reveals, Farmledger sync diagram, form handling
│   ├── hero.js          # Three.js hero scene, loaded lazily
│   └── style.css        # design system (tokens, layout, components)
├── public/
│   ├── photo.webp, photo.jpg
│   ├── og.png                 # social preview image
│   ├── favicon.ico
│   ├── payflow-preview.svg    # placeholder, swap for a real screenshot
│   ├── mamaspace-preview.svg  # placeholder, swap for a real screenshot
│   └── Oluwafemi_Ajayi_Resume.pdf
└── vite.config.js
```

## Still open

- Replace the PayFlow AI and MamaSpace preview SVGs with real screenshots.
- Update the PDF résumé: summary wording and a Farmledger entry.
- Add case-study detail for each project.
