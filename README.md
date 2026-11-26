# Speedrundle

Speedrun your daily puzzle games. Speedrundle is a Chrome extension (Manifest V3) that strings your daily puzzles — Wordle, the NYT Mini, Strands, Connections, and more — into a single timed run, with automatic splits when each game detects your win (or loss).

## How it works

- The extension's **side panel** (a Svelte app) drives the run: it opens each puzzle in a tab, tracks the timer, and records splits.
- A **content script** is injected into supported puzzle sites. When the tab shows the current puzzle, it watches for the configured win/lose condition — either a DOM element (e.g. a "Congratulations!" heading) or a value the game writes to `localStorage` — and reports `GAME_FINISHED` back to the side panel.
- Closing the puzzle tab counts as a DNF. Pausing opens an interstitial tab so you can't peek at the puzzle.

Puzzle definitions live in `public/links.json`; each entry declares its URL, icon, and win/lose checks.

## Development

```sh
npm install
npm run dev      # plain-web dev mode (uses localStorage instead of chrome.storage)
```

In dev mode the app runs in a normal browser tab, but tab management and auto-detection only work inside the extension.

## Building the extension

```sh
npm run build    # outputs the unpacked extension into extension/
```

Then load it in Chrome:

1. Go to `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select the `extension/` directory.
3. Click the Speedrundle toolbar icon to open the side panel.

## Other scripts

```sh
npm run check    # svelte-check (type-checks .svelte and .js sources)
npm run format   # prettier
```

## Project layout

```
public/             Static extension assets (manifest, content script, links.json)
  manifest.json     MV3 manifest; registers the content script per puzzle site
  content-script.js Win/lose detection, injected into puzzle tabs
  links.json        Puzzle catalogue (URLs, icons, win/lose checks)
src/
  App.svelte        Side panel: run state, tab management, pause/resume
  lib/component/    UI components (Timer, PuzzleList, Overlay, Share, ...)
  lib/store/        Svelte 5 rune stores (puzzles, settings, theme)
  lib/event.svelte.js  GAME_FINISHED message handler
extension/          Build output (gitignored) — load this into Chrome
```
