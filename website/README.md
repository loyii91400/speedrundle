# Speedrundle Website

Static catalogue of every daily game playable in the [Speedrundle](../README.md) browser
extension — with search, category filtering, per-game detail pages, and extension install
instructions.

Built with [SvelteKit](https://svelte.dev) and prerendered to a fully static site with
`@sveltejs/adapter-static`.

## Development

```sh
npm install
npm run dev        # local dev server
npm run build      # static output in build/
npm run preview    # preview the production build
npm run check      # svelte-check
```

## Adding a game

The game catalogue lives in `src/lib/data/games.json` and is the **single source of truth**
for both this site and the extension. Each entry has:

- Site fields: `slug`, `category`, `publisher`, `description`
- Extension contract fields: `name`, `url`, `icon`, `winCheck`, `loseCheck`

For storage checks, `entryPath` selects independent puzzle states (for example
`states.*`) and `idPath` identifies a new day when one object is reused (for
example `gameId`). When `entryPath` is present, `path`, `idPath`, and
`counterPath` are relative to it. Use `increases` only for cumulative counters
such as Wiki Game Daily's `daysCompleted`, not for a daily game ID.

Categories are listed in the `categories` array at the top of `games.json`. Colors are
assigned automatically from a palette by position in that array — just append a new category
to the list and it gets the next color (sky, emerald, violet, rose, teal, fuchsia, lime,
indigo, then it cycles). Appending at the end keeps existing category colors stable.

After editing the catalogue, run:

```sh
npm run sync:links
```

This regenerates `../public/links.json` (what the extension loads — including `category` and
`publisher`, which power the extension's settings search/filter) and updates the
content-script `matches` in `../public/manifest.json` (so win/lose detection runs on every
game's site).

## Deployment

`npm run build` emits a plain static site into `build/` — host it anywhere (GitHub Pages,
Netlify, Cloudflare Pages, …).
