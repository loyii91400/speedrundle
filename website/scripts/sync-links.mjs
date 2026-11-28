/**
 * Keep the extension in sync with this site's game catalogue.
 *
 * `src/lib/data/games.json` is the single source of truth. This script:
 *   1. Writes `extension/public/links.json` (what the extension side panel loads), stripping
 *      website-only fields (slug, description). Category and publisher are kept —
 *      the extension's puzzle settings use them for search and filtering.
 *   2. Updates content-script `matches` lists in the Chrome and Firefox manifests from each
 *      game's explicit matchPatterns. Share-result capture is limited to games with
 *      captureResults enabled.
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

// 2. Content-script matches are an explicit per-game permission boundary. Do not
// silently fall back to origin-wide access when adding a game.
for (const game of catalogue.games) {
  if (
    !Array.isArray(game.matchPatterns) ||
    game.matchPatterns.length === 0 ||
    game.matchPatterns.some(
      (pattern) => typeof pattern !== 'string' || pattern.length === 0
    )
  ) {
    throw new Error(
      `${game.slug ?? game.name}: matchPatterns must contain at least one non-empty string`
    );
  }
  if (typeof game.captureResults !== 'boolean') {
    throw new Error(
      `${game.slug ?? game.name}: captureResults must be a boolean`
    );
  }
}

const unique = (values) => [...new Set(values)];
const detectionMatches = unique(
  catalogue.games.flatMap((game) => game.matchPatterns)
);
const captureMatches = unique(
  catalogue.games
    .filter((game) => game.captureResults)
    .flatMap((game) => game.matchPatterns)
);

for (const browser of ['chrome', 'firefox']) {
  const manifestPath = fileURLToPath(
    new URL(`../../extension/${browser}/manifest.json`, import.meta.url)
  );
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const scriptsByName = Object.fromEntries(
    manifest.content_scripts.map((script) => [script.js[0], script])
  );
  const detectionScript = scriptsByName['content-script.js'];
  const captureScript = scriptsByName['clipboard-listener.js'];
  if (!detectionScript || !captureScript) {
    throw new Error(
      `${browser}: expected content-script.js and clipboard-listener.js entries`
    );
  }
  detectionScript.matches = detectionMatches;
  captureScript.matches = captureMatches;
  await writeJson(manifestPath, manifest);
}
console.log(
  `updated Chrome and Firefox content-script matches: ${detectionMatches.length} detection, ${captureMatches.length} capture`
);
