/**
 * A DOM-based check watches for an element (optionally with matching text);
 * a storage check reads values the game writes to localStorage. For storage
 * checks, "key" reads one entry, "keyPrefix" scans all entries starting with
 * it, and a "*" path segment scans every array element/object value
 * (e.g. "states.*.data.status"). "equals" matches a fixed value;
 * "increases" requires a numeric counter to rise above its value at arm time.
 * "counterPath" selects a separate freshness counter, such as a game ID.
 *
 * @typedef {{ mutationType?: string, query: string, text?: string | string[] } | { type: 'storage', key?: string, keyPrefix?: string, path: string, equals?: any, counterPath?: string, increases?: boolean }} PuzzleCheck
 *
 * @typedef {object} Puzzle
 * @property {string} name
 * @property {string} url
 * @property {string} icon
 * @property {string} [category] - e.g. Words, Trivia, Music (from links.json)
 * @property {string} [publisher]
 * @property {boolean} active
 * @property {number} index
 * @property {PuzzleCheck} winCheck
 * @property {PuzzleCheck | null} loseCheck - null to only detect wins
 */

import { storageGet, storageSet } from './storage.js';

// Initial puzzle list
/** @type {Puzzle[]} */
const initialPuzzles = [];

/**
 * Accept arrays and JSON strings, plus the numeric-key objects Chrome created
 * when older versions passed the Svelte array proxy directly to storage.
 * @param {unknown} value
 * @returns {Puzzle[] | null}
 */
function normalizeSavedPuzzles(value) {
  const saved = typeof value === 'string' ? JSON.parse(value) : value;
  if (Array.isArray(saved)) return saved;
  if (!saved || typeof saved !== 'object') return null;
  const entries = Object.entries(saved);
  if (!entries.every(([key]) => /^\d+$/.test(key))) return null;
  return entries
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, puzzle]) => puzzle);
}

function createPuzzles() {
  let puzzles = $state(initialPuzzles);
  let currentPuzzle = $state(0);

  return {
    get puzzles() {
      return puzzles;
    },
    get activePuzzles() {
      return puzzles.filter((p) => p.active).sort((a, b) => a.index - b.index);
    },
    /**
     * @param {Puzzle[]} value
     */
    set puzzles(value) {
      puzzles = value;
      if (puzzles.length > 0) {
        this.save();
      }
    },
    get currentPuzzle() {
      return currentPuzzle;
    },
    /**
     * @param {number} value
     */
    setCurrentPuzzle(value) {
      currentPuzzle = value;
      this.save();
    },
    incrementCurrentPuzzle() {
      currentPuzzle++;
      this.save();
    },
    resetCurrentPuzzle() {
      currentPuzzle = 0;
      this.save();
    },
    /**
     * @param {Puzzle} puzzle
     */
    addPuzzle(puzzle) {
      puzzles = [...puzzles, puzzle];
      this.save();
    },
    /**
     * @param {string} puzzleUrl
     */
    removePuzzle(puzzleUrl) {
      puzzles = puzzles.filter((p) => p.url !== puzzleUrl);
      this.save();
    },
    clearPuzzles() {
      puzzles = [];
      this.save();
    },
    async load() {
      const result = await storageGet(['puzzles', 'currentPuzzle']);
      const saved = normalizeSavedPuzzles(result.puzzles);
      if (saved) {
        puzzles = saved;
      }
      // Restore progress too — without this, a panel reload mid-run showed
      // puzzle 0 while the content script was armed for a later one.
      if (typeof result.currentPuzzle === 'number') {
        currentPuzzle = result.currentPuzzle;
      }
    },
    save() {
      storageSet({ puzzles: $state.snapshot(puzzles), currentPuzzle });
    },
  };
}

const puzzlesStore = createPuzzles();
export default puzzlesStore;
