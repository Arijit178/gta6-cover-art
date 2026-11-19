# Vice City Cover Studio

[![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Arijit178/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Arijit178/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Entered on make.fun: https://make.fun/?ref=v81rq9jc

Turn your own photos into bold, multi-panel GTA-style cover art — a Vice City sunset
or neon colour grade, heavy caption lettering, and a PNG ready to post. Everything
runs offline in the browser: photos stay on your machine, nothing is uploaded.

## What it does

- **Any photo:** add one or several photos from your machine (file picker or
  drag-and-drop). One photo can fill every panel, or each panel can use its own.
- **Crop and position each panel:** click a panel to select it, drag to pan the
  photo, scroll or use the slider to zoom, and switch between fill and fit.
- **Four layouts:** 4-panel grid, hero + 3 small panels, full-bleed single photo,
  and a tilted snapshot collage with white photo borders.
- **Caption editing:** a big bold main title and an optional script subtitle, with
  presets (Sunset Heist, Boulevard Queen, Neon Shore, Pier Pressure), editable
  text, font, size, placement, colour or gradient, outline and shadow.
- **Colour grades and finish:** Vice City sunset, neon pink/teal, golden hour and
  noir grades (canvas gradient maps and overlays), plus film grain, vignette and
  a halftone-dots option.
- **Fast export:** one click exports a PNG at 1080 × 1080, 1080 × 1350 or
  1920 × 1080 — the same canvas that paints the live preview, so what you see is
  what the file holds. Undo/redo included.

All artwork and lettering are original. No Rockstar logo, wordmark, official
artwork or font is used: the type is set in Anton, Bebas Neue and Pacifico, all
SIL Open Font License fonts vendored under `app/fonts/` with their licence texts.
The two built-in sample photos (`app/samples/`) were made with an image model for
make.fun and are free to use.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080.

## Screenshots

- `screenshots/1-cover.jpg` — a landscape cover (1920 × 1080) exported by the app.
- `screenshots/2-editor.jpg` — the editor in the browser with photos loaded.
- `screenshots/3-cover.jpg` — a portrait cover (1080 × 1350) exported by the app.
- `screenshots/4-cover.jpg` — a square cover (1080 × 1080) exported by the app.
