/**
 * Keep the extension in sync with this site's game catalogue.
 *
 * `src/lib/data/games.json` is the single source of truth. This script:
 *   1. Writes `public/links.json` (what the extension side panel loads), stripping
 *      website-only fields (slug, category, publisher, description).
 *   2. Updates the content-script `matches` in `public/manifest.json` so the
 *      win/lose detection script is injected on every game's site.
 *
 * Run from the website directory: npm run sync:links
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

/**
 * Write JSON formatted like the repo's other files (via Prettier), so syncing
 * never produces formatting-only churn in the extension's files.
 * @param {string} path
 * @param {unknown} data
 */
async function writeJson(path, data) {
  const options = (await prettier.resolveConfig(path)) ?? {};
  const json = JSON.stringify(data, null, 2);
  writeFileSync(path, await prettier.format(json, { ...options, parser: 'json' }));
}

const catalogue = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/lib/data/games.json', import.meta.url)), 'utf8')
);

// 1. Extension puzzle catalogue: the extension contract fields only.
const links = catalogue.games.map((game) => ({
  name: game.name,
  url: game.url,
  icon: game.icon,
  winCheck: game.winCheck,
  loseCheck: game.loseCheck
}));
const linksPath = fileURLToPath(new URL('../../public/links.json', import.meta.url));
await writeJson(linksPath, links);
console.log(`wrote ${links.length} games to public/links.json`);

// 2. Content-script matches: every game's origin, so detection runs everywhere.
const manifestPath = fileURLToPath(new URL('../../public/manifest.json', import.meta.url));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const matches = [...new Set(links.map((game) => `${new URL(game.url).origin}/*`))];
manifest.content_scripts[0].matches = matches;
await writeJson(manifestPath, manifest);
console.log(`updated content-script matches: ${matches.join(', ')}`);
