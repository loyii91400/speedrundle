import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(
  new URL('../public/content-script.js', import.meta.url),
  'utf8'
);

function createHarness(initialStorage = {}) {
  const localStorage = {
    getItem(key) {
      return Object.hasOwn(this, key) ? this[key] : null;
    },
  };
  for (const [key, value] of Object.entries(initialStorage)) {
    localStorage[key] = JSON.stringify(value);
  }

  const messages = [];
  const context = vm.createContext({
    console: { log() {}, warn() {}, error() {} },
    localStorage,
    location: {
      href: 'https://www.nytimes.com/games/wordle/index.html',
      origin: 'https://www.nytimes.com',
      pathname: '/games/wordle/index.html',
    },
    document: { querySelectorAll: () => [] },
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    chrome: {
      runtime: {
        sendMessage(message) {
          messages.push(message);
          return Promise.resolve();
        },
      },
      storage: {
        // Keep the automatic initial update pending; tests arm explicitly.
        local: { get: () => new Promise(() => {}) },
        onChanged: { addListener() {} },
      },
    },
    setInterval: () => 1,
    clearInterval() {},
    setTimeout: () => 1,
    clearTimeout() {},
  });
  vm.runInContext(
    `${source}\nglobalThis.__test = { arm, scan, collectStorageEntries, normalizeStorageCheck };`,
    context
  );

  return {
    api: context.__test,
    messages,
    set(key, value) {
      localStorage[key] = JSON.stringify(value);
    },
    statuses() {
      return messages.map((message) => message.data.status);
    },
  };
}

function arm(harness, winCheck, loseCheck = null) {
  harness.api.arm(
    {
      name: 'Test puzzle',
      url: 'https://www.nytimes.com/games/wordle/index.html',
      winCheck,
      loseCheck,
    },
    'test'
  );
  harness.api.scan(null);
}

const wordleKey = 'games-state-wordleV2/ANON';
const wordleWin = {
  type: 'storage',
  keyPrefix: 'games-state-wordleV2/',
  entryPath: 'states.*',
  path: 'data.status',
  equals: 'WIN',
};

test('a historical NYT win does not block the current puzzle win', () => {
  const harness = createHarness({
    [wordleKey]: {
      states: {
        yesterday: { data: { status: 'WIN' } },
        today: { data: { status: 'IN_PROGRESS' } },
      },
    },
  });
  arm(harness, wordleWin);
  assert.deepEqual(harness.statuses(), []);

  harness.set(wordleKey, {
    states: {
      yesterday: { data: { status: 'WIN' } },
      today: { data: { status: 'WIN' } },
    },
  });
  harness.api.scan(null);
  assert.deepEqual(harness.statuses(), ['WIN']);
});

test('a result already complete at arm time remains suppressed until it clears', () => {
  const harness = createHarness({
    [wordleKey]: { states: { today: { data: { status: 'WIN' } } } },
  });
  arm(harness, wordleWin);
  assert.deepEqual(harness.statuses(), []);

  harness.set(wordleKey, {
    states: { today: { data: { status: 'IN_PROGRESS' } } },
  });
  harness.api.scan(null);
  assert.deepEqual(harness.statuses(), []);

  harness.set(wordleKey, {
    states: { today: { data: { status: 'WIN' } } },
  });
  harness.api.scan(null);
  assert.deepEqual(harness.statuses(), ['WIN']);
});

test('legacy wildcard checks are normalized to independent entries', () => {
  const harness = createHarness({
    [wordleKey]: {
      states: {
        yesterday: { data: { status: 'WIN' } },
        today: { data: { status: 'IN_PROGRESS' } },
      },
    },
  });
  arm(harness, {
    type: 'storage',
    keyPrefix: 'games-state-wordleV2/',
    path: 'states.*.data.status',
    equals: 'WIN',
  });
  assert.deepEqual(harness.statuses(), []);

  harness.set(wordleKey, {
    states: {
      yesterday: { data: { status: 'WIN' } },
      today: { data: { status: 'WIN' } },
    },
  });
  harness.api.scan(null);
  assert.deepEqual(harness.statuses(), ['WIN']);
});

test('a newly created matching daily entry is eligible after arming', () => {
  const harness = createHarness({
    [wordleKey]: {
      states: { yesterday: { data: { status: 'WIN' } } },
    },
  });
  arm(harness, wordleWin);
  harness.set(wordleKey, {
    states: {
      yesterday: { data: { status: 'WIN' } },
      today: { data: { status: 'WIN' } },
    },
  });
  harness.api.scan(null);
  assert.deepEqual(harness.statuses(), ['WIN']);
});

test('Bandle detects a new daily gameId even when the old win never clears', () => {
  const harness = createHarness({
    status: { gameId: 100, win: true, loose: false },
  });
  const check = {
    type: 'storage',
    key: 'status',
    idPath: 'gameId',
    path: 'win',
    equals: true,
  };
  arm(harness, check);
  assert.deepEqual(harness.statuses(), []);

  harness.set('status', { gameId: 101, win: true, loose: false });
  harness.api.scan(null);
  assert.deepEqual(harness.statuses(), ['WIN']);
});

test('learning an initially missing Bandle gameId does not rearm a stale win', () => {
  const harness = createHarness({ status: { win: true, loose: false } });
  const check = {
    type: 'storage',
    key: 'status',
    idPath: 'gameId',
    path: 'win',
    equals: true,
  };
  arm(harness, check);
  harness.set('status', { gameId: 100, win: true, loose: false });
  harness.api.scan(null);
  assert.deepEqual(harness.statuses(), []);

  harness.set('status', { gameId: 101, win: true, loose: false });
  harness.api.scan(null);
  assert.deepEqual(harness.statuses(), ['WIN']);
});

test('Wiki Game Daily only fires when its cumulative counter increases', () => {
  const harness = createHarness({ wikipediaGameStats: { daysCompleted: 7 } });
  arm(harness, {
    type: 'storage',
    key: 'wikipediaGameStats',
    path: 'daysCompleted',
    increases: true,
  });
  harness.api.scan(null);
  assert.deepEqual(harness.statuses(), []);

  harness.set('wikipediaGameStats', { daysCompleted: 8 });
  harness.api.scan(null);
  assert.deepEqual(harness.statuses(), ['WIN']);
});

test('a first-time Wiki counter created after arming starts from zero', () => {
  const harness = createHarness();
  arm(harness, {
    type: 'storage',
    key: 'wikipediaGameStats',
    path: 'daysCompleted',
    increases: true,
  });
  harness.set('wikipediaGameStats', { daysCompleted: 1 });
  harness.api.scan(null);
  assert.deepEqual(harness.statuses(), ['WIN']);
});

test('Connections reports a win before the completion loss check', () => {
  const key = 'games-state-connections/ANON';
  const harness = createHarness({
    [key]: {
      states: {
        yesterday: { data: { puzzleWon: true, puzzleComplete: true } },
        today: { data: { puzzleWon: false, puzzleComplete: false } },
      },
    },
  });
  arm(
    harness,
    {
      type: 'storage',
      keyPrefix: 'games-state-connections/',
      entryPath: 'states.*',
      path: 'data.puzzleWon',
      equals: true,
    },
    {
      type: 'storage',
      keyPrefix: 'games-state-connections/',
      entryPath: 'states.*',
      path: 'data.puzzleComplete',
      equals: true,
    }
  );
  harness.set(key, {
    states: {
      yesterday: { data: { puzzleWon: true, puzzleComplete: true } },
      today: { data: { puzzleWon: true, puzzleComplete: true } },
    },
  });
  harness.api.scan(null);
  assert.deepEqual(harness.statuses(), ['WIN']);
});

test('Connections still reports a current-day loss with historical wins present', () => {
  const key = 'games-state-connections/ANON';
  const harness = createHarness({
    [key]: {
      states: {
        yesterday: { data: { puzzleWon: true, puzzleComplete: true } },
        today: { data: { puzzleWon: false, puzzleComplete: false } },
      },
    },
  });
  arm(
    harness,
    {
      type: 'storage',
      keyPrefix: 'games-state-connections/',
      entryPath: 'states.*',
      path: 'data.puzzleWon',
      equals: true,
    },
    {
      type: 'storage',
      keyPrefix: 'games-state-connections/',
      entryPath: 'states.*',
      path: 'data.puzzleComplete',
      equals: true,
    }
  );
  harness.set(key, {
    states: {
      yesterday: { data: { puzzleWon: true, puzzleComplete: true } },
      today: { data: { puzzleWon: false, puzzleComplete: true } },
    },
  });
  harness.api.scan(null);
  assert.deepEqual(harness.statuses(), ['LOSE']);
});
