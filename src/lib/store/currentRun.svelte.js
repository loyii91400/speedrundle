import { storageGet, storageSet } from './storage.js';

const STORAGE_KEY = 'currentRun';
const RUN_VERSION = 1;

function emptyRun() {
  return {
    runId: null,
    scores: {},
    splits: [],
    finishTime: null,
  };
}

/**
 * @param {unknown} value
 * @returns {{ runId: string | null, scores: Record<number, string>, splits: string[], finishTime: string | null }}
 */
function normalizeRun(value) {
  if (!value || typeof value !== 'object') return emptyRun();
  const saved = /** @type {any} */ (value);
  if (saved.version !== RUN_VERSION) return emptyRun();

  /** @type {Record<number, string>} */
  const scores = {};
  if (saved.scores && typeof saved.scores === 'object') {
    for (const [index, resultText] of Object.entries(saved.scores)) {
      if (
        /^\d+$/.test(index) &&
        typeof resultText === 'string' &&
        resultText.trim()
      ) {
        scores[Number(index)] = resultText;
      }
    }
  }

  return {
    runId: typeof saved.runId === 'string' ? saved.runId : null,
    scores,
    splits: Array.isArray(saved.splits)
      ? saved.splits.filter(
          (/** @type {unknown} */ split) => typeof split === 'string'
        )
      : [],
    finishTime: typeof saved.finishTime === 'string' ? saved.finishTime : null,
  };
}

function createCurrentRun() {
  /** @type {string | null} */
  let runId = $state(null);
  /** @type {Record<number, string>} */
  let currentScores = $state({});
  /** @type {string[]} */
  let splits = $state([]);
  /** @type {string | null} */
  let finishTime = $state(null);
  /** @type {string | null} */
  let error = $state(null);
  /** @type {Promise<boolean> | null} */
  let loadPromise = null;
  /** @type {Promise<void>} */
  let writeQueue = Promise.resolve();

  async function readRun() {
    try {
      const result = await storageGet([STORAGE_KEY]);
      const saved = normalizeRun(result[STORAGE_KEY]);
      runId = saved.runId;
      currentScores = saved.scores;
      splits = saved.splits;
      finishTime = saved.finishTime;
      error = null;
      return true;
    } catch (cause) {
      console.error('Failed to load the current run:', cause);
      error = 'Could not restore the current run.';
      return false;
    }
  }

  function load() {
    if (loadPromise === null) loadPromise = readRun();
    return loadPromise;
  }

  function persist() {
    const data = {
      version: RUN_VERSION,
      runId,
      scores: $state.snapshot(currentScores),
      splits: $state.snapshot(splits),
      finishTime,
    };
    // Split and finish often happen back-to-back. Keep writes in that order so
    // an earlier snapshot cannot overwrite the finished run when it completes.
    writeQueue = writeQueue.then(async () => {
      try {
        await storageSet({ [STORAGE_KEY]: data });
        error = null;
      } catch (cause) {
        console.error('Failed to save the current run:', cause);
        error =
          'Could not save the current run. Please check browser storage permissions.';
      }
    });
    return writeQueue;
  }

  return {
    get runId() {
      return runId;
    },
    get currentScores() {
      return currentScores;
    },
    get splits() {
      return splits;
    },
    get finishTime() {
      return finishTime;
    },
    get error() {
      return error;
    },
    load,
    /** @param {string | null} nextRunId */
    async startRun(nextRunId) {
      runId = nextRunId;
      currentScores = {};
      splits = [];
      finishTime = null;
      await persist();
    },
    /**
     * @param {number} index
     * @param {string} split
     */
    async setSplit(index, split) {
      const next = [...splits];
      next[index] = split;
      splits = next;
      await persist();
    },
    /** @param {string} value */
    async setFinishTime(value) {
      finishTime = value;
      await persist();
    },
    /**
     * @param {{ resultText: string, runId?: string | null, puzzleIndex?: number | null }} result
     */
    async addScore(result) {
      if (!(await load())) return;
      if (
        !result ||
        typeof result.resultText !== 'string' ||
        !result.resultText.trim() ||
        runId === null ||
        result.runId !== runId ||
        typeof result.puzzleIndex !== 'number' ||
        !Number.isInteger(result.puzzleIndex) ||
        result.puzzleIndex < 0
      ) {
        return;
      }

      currentScores = {
        ...currentScores,
        [result.puzzleIndex]: result.resultText,
      };
      await persist();
    },
  };
}

const currentRunStore = createCurrentRun();
export default currentRunStore;
