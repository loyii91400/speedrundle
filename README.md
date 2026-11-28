# Daily Games Speedrun

Speedrun your daily puzzle games. Daily Games Speedrun is a browser extension (Manifest V3) that strings your daily puzzles — Wordle, the NYT Mini, Strands, Connections, and more — into a single timed run, with automatic splits when each game detects your win (or loss).

Install it from the [Chrome Web Store](https://chromewebstore.google.com/detail/dbfenbaoamakbdffgddofjmfeblfjohl) or [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/daily-games-speedrun/), or build either version from source (below).

## How it works

- The extension's **side panel** (a Svelte app) drives the run: it opens each puzzle in a tab, tracks the timer, and records splits.
- Game results are captured automatically after completion using each game's configurable `scoreButton` rule in `website/src/lib/data/games.json`. The copied result text and split time are saved beside each puzzle for the **current run only**, along with the final time. Starting or resetting a run replaces that saved state. Manual Share clicks remain available as a fallback.
- A **content script** is injected into supported puzzle sites. When the tab shows the current puzzle, it watches for the configured win/lose condition — either a DOM element (e.g. a "Congratulations!" heading) or a value the game writes to `localStorage` — and reports `GAME_FINISHED` back to the side panel.
- Closing the puzzle tab counts as a DNF. Pausing opens an interstitial tab so you can't peek at the puzzle.

Puzzle definitions live in `extension/public/links.json`; each entry declares its URL, icon, and win/lose checks.

## Development

```sh
cd extension
npm install
npm run dev      # plain-web dev mode (uses localStorage instead of chrome.storage)
```

In dev mode the app runs in a normal browser tab, but tab management and auto-detection only work inside the extension.

## Bumping the extension version

From `extension/`, run one command:

```sh
npm run bump -- patch  # bug fixes and small changes
npm run bump -- minor  # new backward-compatible features
npm run bump -- major  # breaking changes
```

You can also pass an explicit version, such as `npm run bump -- 1.2.0`. This updates `package.json`, `package-lock.json`, and both browser manifests without creating a Git commit or tag.

## Building the extension

```sh
cd extension
npm run build
```

This creates two unpacked extensions and their ZIP archives:

- Chrome: `extension/dist/chrome/` and `extension/dist/daily-games-speedrun-chrome.zip`
- Firefox: `extension/dist/firefox/` and `extension/dist/daily-games-speedrun-firefox.zip`

Each ZIP contains `manifest.json` at its root, ready for browser-store upload. You can also build and zip only one browser with `npm run build:chrome` or `npm run build:firefox` from `extension/`.

### Load in Chrome

1. Go to `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select the `extension/dist/chrome/` directory.
3. Click the Daily Games Speedrun toolbar icon to open the side panel.

### Load temporarily in Firefox

1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and select `extension/dist/firefox/manifest.json`.
3. Click the Daily Games Speedrun toolbar icon to open the sidebar.

## Firefox source-code submission

See [SOURCE_SUBMISSION.md](SOURCE_SUBMISSION.md) for the exact build environment, Node.js and npm
installation steps, reproducible Firefox build instructions, and source-package contents.

To create the source-code ZIP required for addons.mozilla.org, run:

```sh
cd extension
npm ci
npm run package:source
```

This creates `extension/dist/daily-games-speedrun-source-v<version>.zip`. The archive contains the
original source and lockfiles, excluding dependencies, build outputs, local environment files, and
existing archives. Upload this source archive separately from the built Firefox add-on ZIP.

## Other scripts

Run these from `extension/`:

```sh
npm test         # storage win/lose detection regression tests
npm run check    # svelte-check (type-checks .svelte and .js sources)
npm run format   # prettier
```

## Project layout

```
extension/
  chrome/            Chrome manifest and background service worker
  firefox/           Firefox manifest and background script
  public/            Shared static assets
    content-script.js
    clipboard-listener.js
    links.json
  src/               Shared Svelte side panel/sidebar app
  tests/             Content-script regression tests
  dist/              Generated browser builds (gitignored)
website/             Static SvelteKit catalogue and install site
```

## Website

`website/` is a static SvelteKit site listing every game playable in the extension, with
search, category filters, and install instructions:

```sh
cd website
npm install
npm run dev        # local dev server
npm run sync:links # regenerate links.json + both browser manifests' match lists
```

The game catalogue lives in `website/src/lib/data/games.json` — the single source of truth
for both the site and the extension. Each game declares `matchPatterns` to scope content-script
access and `captureResults` to control whether the share-result observer is injected. After
adding a game there, run `npm run sync:links` in `website/` so the extension can load and detect it.
