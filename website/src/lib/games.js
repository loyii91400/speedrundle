import catalogue from '$lib/data/games.json';

/**
 * A win/lose condition the extension watches for during a run.
 * Either a DOM check (`query` + `text`) or a storage check (`type: 'storage'`).
 * @typedef {Object} WinCheck
 * @property {string} [type]
 * @property {string} [key]
 * @property {string} [keyPrefix]
 * @property {string} [entryPath] - Independent puzzle states, e.g. `states.*`
 * @property {string} [idPath] - Daily identity within an entry, e.g. `gameId`
 * @property {string} [path] - Result path, relative to entryPath when present
 * @property {*} [equals]
 * @property {string} [counterPath]
 * @property {boolean} [increases]
 * @property {string} [query]
 * @property {string | string[]} [text]
 */

/**
 * @typedef {Object} Game
 * @property {string} slug
 * @property {string} name
 * @property {string} url
 * @property {string} icon
 * @property {string} category
 * @property {string} publisher
 * @property {string} description
 * @property {WinCheck | null} winCheck
 * @property {WinCheck | null} loseCheck
 * @property {{ query: string, text?: string | string[] } | null} [scoreButton] - Share control clicked after completion to capture its result text
 */

/** GitHub repository for the extension. */
export const REPO_URL = 'https://github.com/loyii91400/speedrundle';

/** Chrome Web Store listing for the extension. */
export const STORE_URL =
  'https://chromewebstore.google.com/detail/dbfenbaoamakbdffgddofjmfeblfjohl';

/** All games in the catalogue. @type {Game[]} */
export const games = catalogue.games;

/** All category names, in display order. */
export const categories = catalogue.categories;

/**
 * Color palette cycled by category, so colors stay distinct as categories are
 * added. Amber is deliberately excluded — it's the site's accent color ("All"
 * chip, Play buttons). Class names are written out in full so Tailwind keeps
 * them in the build.
 * @type {{badge: string, text: string, chipActive: string, dot: string}[]}
 */
const colorPalette = [
  {
    badge: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
    text: 'text-sky-300',
    chipActive: 'bg-sky-400 text-zinc-950 hover:bg-sky-300',
    dot: 'bg-sky-400'
  },
  {
    badge: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    text: 'text-emerald-300',
    chipActive: 'bg-emerald-400 text-zinc-950 hover:bg-emerald-300',
    dot: 'bg-emerald-400'
  },
  {
    badge: 'border-violet-400/40 bg-violet-400/10 text-violet-300',
    text: 'text-violet-300',
    chipActive: 'bg-violet-400 text-zinc-950 hover:bg-violet-300',
    dot: 'bg-violet-400'
  },
  {
    badge: 'border-rose-400/40 bg-rose-400/10 text-rose-300',
    text: 'text-rose-300',
    chipActive: 'bg-rose-400 text-zinc-950 hover:bg-rose-300',
    dot: 'bg-rose-400'
  },
  {
    badge: 'border-teal-400/40 bg-teal-400/10 text-teal-300',
    text: 'text-teal-300',
    chipActive: 'bg-teal-400 text-zinc-950 hover:bg-teal-300',
    dot: 'bg-teal-400'
  },
  {
    badge: 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300',
    text: 'text-fuchsia-300',
    chipActive: 'bg-fuchsia-400 text-zinc-950 hover:bg-fuchsia-300',
    dot: 'bg-fuchsia-400'
  },
  {
    badge: 'border-lime-400/40 bg-lime-400/10 text-lime-300',
    text: 'text-lime-300',
    chipActive: 'bg-lime-400 text-zinc-950 hover:bg-lime-300',
    dot: 'bg-lime-400'
  },
  {
    badge: 'border-indigo-400/40 bg-indigo-400/10 text-indigo-300',
    text: 'text-indigo-300',
    chipActive: 'bg-indigo-400 text-zinc-950 hover:bg-indigo-300',
    dot: 'bg-indigo-400'
  }
];

const fallbackColor = {
  badge: 'border-zinc-700 bg-zinc-800/40 text-zinc-300',
  text: 'text-zinc-300',
  chipActive: 'bg-zinc-200 text-zinc-950 hover:bg-zinc-100',
  dot: 'bg-zinc-400'
};

/**
 * Styles for a category, picked from the palette by its position in the
 * `categories` list — so a newly added category gets the next color
 * automatically. Append new categories at the end of the list to keep
 * existing colors stable. Unknown categories fall back to neutral zinc.
 * @param {string} category
 */
export function categoryStyle(category) {
  const index = categories.indexOf(category);
  if (index === -1) return fallbackColor;
  return colorPalette[index % colorPalette.length];
}

/**
 * Hostnames the extension must inject its content script into.
 * Derived from game URLs so every listed game is detectable in a run.
 * @returns {string[]}
 */
export function contentScriptMatches() {
  const origins = games.map((game) => `${new URL(game.url).origin}/*`);
  return [...new Set(origins)];
}
