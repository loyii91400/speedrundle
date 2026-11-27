/**
 * Keep the extension in sync with this site's game catalogue.
 *
 * `src/lib/data/games.json` is the single source of truth. This script:
 *   1. Writes `extension/public/links.json` (what the extension side panel loads), stripping
 *      website-only fields (slug, description). Category and publisher are kept —
 *      the extension's puzzle settings use them for search and filtering.
 *   2. Updates every content-script `matches` list in the Chrome and Firefox manifests so
 *      detection and Share-result capture are injected on every game's site.
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

// 1. Extension puzzle catalogue: the extension contract fields plus
// category/publisher, which power the extension's settings search/filter.
const links = catalogue.games.map((game) => ({
  name: game.name,
  url: game.url,
  icon: game.icon,
  category: game.category,
  publisher: game.publisher,
  winCheck: game.winCheck,
  loseCheck: game.loseCheck,
  scoreButton: game.scoreButton
}));
const linksPath = fileURLToPath(new URL('../../extension/public/links.json', import.meta.url));
await writeJson(linksPath, links);
console.log(`wrote ${links.length} games to extension/public/links.json`);

// 2. Content-script matches: every game's origin, so all page hooks run everywhere.
const matches = [...new Set(links.map((game) => `${new URL(game.url).origin}/*`))];
for (const browser of ['chrome', 'firefox']) {
  const manifestPath = fileURLToPath(
    new URL(`../../extension/${browser}/manifest.json`, import.meta.url)
  );
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const contentScript of manifest.content_scripts) {
    contentScript.matches = matches;
  }
  await writeJson(manifestPath, manifest);
}
console.log(`updated Chrome and Firefox content-script matches: ${matches.join(', ')}`);
