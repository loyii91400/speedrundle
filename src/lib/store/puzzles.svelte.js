/**
 * A DOM-based check watches for an element (optionally with matching text);
 * a storage check reads values the game writes to localStorage. For storage
 * checks, "key" reads one entry, "keyPrefix" scans all entries starting with
 * it, and a "*" path segment scans every array element/object value
 * (e.g. "states.*.data.status").
 *
 * @typedef {{ mutationType?: string, query: string, text?: string | string[] } | { type: 'storage', key?: string, keyPrefix?: string, path: string, equals: any }} PuzzleCheck
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
      // Backward compatibility: versions before the shared storage helper
      // stored puzzles as a JSON string in chrome.storage.local.
      const saved =
        typeof result.puzzles === 'string'
          ? JSON.parse(result.puzzles)
          : result.puzzles;
      if (Array.isArray(saved)) {
        puzzles = saved;
      }
      // Restore progress too — without this, a panel reload mid-run showed
      // puzzle 0 while the content script was armed for a later one.
      if (typeof result.currentPuzzle === 'number') {
        currentPuzzle = result.currentPuzzle;
      }
    },
    save() {
      storageSet({ puzzles, currentPuzzle });
    },
  };
}

const puzzlesStore = createPuzzles();
export default puzzlesStore;
