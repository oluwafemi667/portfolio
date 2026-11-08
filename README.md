# Portfolio v3

Personal portfolio site for Oluwafemi Ajayi, built as a static Vite project
(no framework). The hero is a live ledger of sample entries from three
projects, with GSAP scroll animations that replay every time a section comes
back into view, and a custom design system.

**Live site:** [ajayioluwafemi.netlify.app](https://ajayioluwafemi.netlify.app)

## Tech stack

- **Build tool:** Vite
- **Animation:** GSAP + ScrollTrigger
- **Hero:** DOM and CSS 3D (`src/hero-ledger.js`). The earlier Three.js sculpture is kept in `src/hero-sculpture.js`
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

## Switching the hero

`src/main.js` has one line that picks the hero:

```js
const HERO = 'ledger';   // or 'sculpture' for the original Three.js glass sculpture
```

`'sculpture'` loads Three.js on demand, so the main bundle stays small either way.

## Animation notes

- Scroll reveals use `toggleActions: 'play reverse play reverse'`, so they play on
  every entry, scrolling down or up, with no reload needed.
- The PayFlow and MamaSpace mockups are inline SVG (`src/mockups/`) animated by
  GSAP timelines in `src/mockups.js`. They loop while on screen and restart on re-entry.
- The Farmledger diagram and the hero ledger only run while visible.
- With `prefers-reduced-motion`, everything shows its finished state with no motion.
- Cursor, tilt and magnetic effects only run on devices with a mouse.

## Project structure

```
├── index.html          # page structure and copy
├── src/
│   ├── main.js              # cursor, reveals, Farmledger diagram, form, hero switch
│   ├── hero-ledger.js       # default hero, loaded after first paint
│   ├── hero-sculpture.js    # original Three.js hero, kept for the switch
│   ├── mockups.js           # PayFlow and MamaSpace animations
│   ├── mockups/*.svg        # the two mockups, inlined at runtime
│   └── style.css            # design system (tokens, layout, components)
├── public/
│   ├── photo.webp, photo.jpg
│   ├── og.png                 # social preview image
│   ├── favicon.ico
│   └── Oluwafemi_Ajayi_Resume.pdf
└── vite.config.js
```

## Still open

- Add case-study detail for each project.
- Run Lighthouse against the live site.

## Hero and How I work (latest)

- `src/main.js` has one line, `const HERO = 'system'`. Options: `'system'` (exploded web app, requests loop through it, default), `'ledger'`, `'sculpture'`.
- `src/hero-system.js` is Three.js, loaded after first paint. It loops while on screen, pauses off screen and replays its entrance on return.
- The How I work section (`#how`) fans four cards out with the scroll on desktop and folds them back when scrolling up. Phones and reduced motion get a plain list. Edit the wording in `index.html`.
- PayFlow and MamaSpace mockups loop forever while visible and restart on every re-entry.

## Ambient scenes and mobile (latest)

- `src/orbs.js` holds two lazy scenes: a glass blob above the contact heading and a ring gyroscope around the About portrait. Each loads when its section is near the screen, runs only while visible, and replays its entrance on every return. Reduced motion gets a still frame.
- `src/noise.js` is the shared noise shader used by the blob and the old sculpture hero.
- On phones the hero scene sits in its own area under the text, clear of the tech strip, and How I work is a stack of sticky cards.
