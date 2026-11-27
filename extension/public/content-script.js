// Speedrundle win/lose detector.
//
// Registered in manifest.json ("content_scripts"), so Chrome injects this on
// configured puzzle sites. The win/lose detector arms itself only when this tab
// shows the current puzzle. Completion triggers the game's configured Share
// action, and score capture remains available afterward as a manual fallback.
//
// IMPORTANT: logs from this file go to the DevTools console of the PAGE this
// script runs on (the puzzle tab) — never to the extension's service worker
// console. Filter the page console by "[Speedrundle]".

const TAG = '[Speedrundle]';

let puzzleState = null; // { key, checks, winWatch, loseWatch }
let observer = null;
let pollInterval = null;
let heartbeatInterval = null;
let scanTimer = null;
const pendingScanTypes = new Set();
let lastStorageReport = { win: '', lose: '' };
let done = false;
let lastPageUrl = location.href;
let scorePuzzle = null; // { name, url } for this page's configured game

function log(...args) {
  console.log(TAG, ...args);
}

function warn(...args) {
  console.warn(TAG, ...args);
}

function clearTimers() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (scanTimer) {
    clearTimeout(scanTimer);
    scanTimer = null;
  }
  pendingScanTypes.clear();
}

function sendResult(status) {
  if (done) return;
  done = true;
  observer?.disconnect();
  observer = null;
  clearTimers();
  captureScore(puzzleState?.scoreButton);
  log(`${status} detected — notifying the side panel`);
  try {
    chrome.runtime
      .sendMessage({ type: 'GAME_FINISHED', data: { status } })
      .then(() => log('GAME_FINISHED delivered to the side panel'))
      .catch((e) =>
        warn('GAME_FINISHED could not be delivered (side panel closed?):', e)
      );
  } catch (e) {
    warn('GAME_FINISHED could not be delivered (extension reloaded?):', e);
  }
}

function sendPuzzleScore(resultText) {
  if (!scorePuzzle || typeof resultText !== 'string' || !resultText.trim()) {
    return false;
  }

  try {
    chrome.runtime
      .sendMessage({
        type: 'PUZZLE_SCORE',
        data: {
          gameName: scorePuzzle.name,
          gameUrl: scorePuzzle.url,
          resultText,
          runId: scorePuzzle.runId ?? null,
          puzzleIndex: scorePuzzle.puzzleIndex ?? null,
        },
      })
      .then(() => log(`Saved ${scorePuzzle.name} Share result`))
      .catch((e) =>
        warn('PUZZLE_SCORE could not be delivered (side panel closed?):', e)
      );
    return true;
  } catch (e) {
    warn('PUZZLE_SCORE could not be delivered (extension reloaded?):', e);
    return false;
  }
}

// Same origin, and the page path is the puzzle path (or below it). Trailing
// "index.html" / "/" are ignored so /games/wordle and /games/wordle/index.html
// both match.
function urlMatchesPuzzle(puzzleUrl) {
  try {
    const expected = new URL(puzzleUrl);
    const normalize = (path) =>
      path.replace(/\/index\.html?$/i, '').replace(/\/+$/, '') || '/';
    const expectedPath = normalize(expected.pathname);
    const actualPath = normalize(location.pathname);
    return (
      location.origin === expected.origin &&
      (expectedPath === '/' ||
        actualPath === expectedPath ||
        actualPath.startsWith(expectedPath + '/'))
    );
  } catch (e) {
    warn(`could not parse puzzle URL "${puzzleUrl}":`, e);
    return false;
  }
}

// Walk a dotted path through parsed JSON. A "*" segment descends into every
// array element / object value. Returns every value found at the end.
function readPath(value, segments) {
  if (segments.length === 0) return [value];
  const [head, ...rest] = segments;
  if (head === '*') {
    const children =
      value && typeof value === 'object' ? Object.values(value) : [];
    return children.flatMap((child) => readPath(child, rest));
  }
  return readPath(value?.[head], rest);
}

// Unlike readPath, retain each wildcard branch as a separate entry. This keeps
// a puzzle's result and daily identity correlated instead of mixing values
// from different days.
function readEntryPath(value, segments, path = []) {
  if (segments.length === 0) {
    return value === undefined ? [] : [{ path, value }];
  }
  if (value === null || typeof value !== 'object') return [];
  const [head, ...rest] = segments;
  if (head === '*') {
    return Object.entries(value).flatMap(([key, child]) =>
      readEntryPath(child, rest, [...path, key])
    );
  }
  return readEntryPath(value[head], rest, [...path, head]);
}

function pathSegments(path) {
  return path ? path.split('.') : [];
}

// Checks saved by older versions put wildcards in `path`. Interpret everything
// through the last wildcard as entryPath so those saved puzzles get the same
// per-day behavior after the extension updates.
function normalizeStorageCheck(check) {
  if (check?.type !== 'storage' || check.entryPath) return check;
  const segments = pathSegments(check.path);
  const wildcard = segments.lastIndexOf('*');
  if (wildcard === -1) return check;
  const entryPath = segments.slice(0, wildcard + 1).join('.');
  const prefix = `${entryPath}.`;
  const relativePath = (path) =>
    path?.startsWith(prefix) ? path.slice(prefix.length) : path;
  return {
    ...check,
    entryPath,
    path: segments.slice(wildcard + 1).join('.'),
    counterPath: relativePath(check.counterPath),
    idPath: relativePath(check.idPath),
  };
}

// Storage checks read values the game itself writes to localStorage (shared
// with content scripts). `key` reads one entry; `keyPrefix` scans every entry
// whose key starts with the prefix. `entryPath` identifies independent puzzle
// states, and `idPath` identifies a new day when one storage object is reused.
// `equals` matches a fixed value; `increases` requires a fresh numeric counter.
function storageKeys(check) {
  if (check.key) return [check.key];
  if (check.keyPrefix) {
    return Object.keys(localStorage).filter((k) =>
      k.startsWith(check.keyPrefix)
    );
  }
  return [];
}

// Every independent storage entry currently visible to a check. An entry's
// slot identifies its location; its identity changes when idPath changes.
function collectStorageEntries(check) {
  const out = [];
  for (const key of storageKeys(check)) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    try {
      const parsed = JSON.parse(raw);
      const entries = check.entryPath
        ? readEntryPath(parsed, pathSegments(check.entryPath))
        : [{ path: [], value: parsed }];
      for (const entry of entries) {
        const ids = check.idPath
          ? readPath(entry.value, pathSegments(check.idPath)).filter(
              (v) => v !== undefined
            )
          : [];
        out.push({
          key,
          entryPath: entry.path.join('.'),
          slot: JSON.stringify([key, entry.path]),
          identity: check.idPath
            ? ids.length
              ? JSON.stringify(ids)
              : null
            : JSON.stringify(entry.path),
          values: readPath(entry.value, pathSegments(check.path)),
          counterValues: check.counterPath
            ? readPath(entry.value, pathSegments(check.counterPath))
            : undefined,
        });
      }
    } catch (e) {
      out.push({
        key,
        entryPath: '',
        slot: JSON.stringify([key, []]),
        identity: null,
        values: [],
        error: String(e),
      });
    }
  }
  return out;
}

function formatValue(v) {
  const s = typeof v === 'string' ? JSON.stringify(v) : String(v);
  return s === undefined ? 'undefined' : s;
}

// One-line description of everything a storage check sees right now.
function storageReport(check) {
  const found = collectStorageEntries(check);
  if (found.length === 0) return 'no localStorage keys match yet';
  return found
    .map((f) => {
      if (f.error) return `${f.key} → parse error: ${f.error}`;
      const values = f.values.length
        ? f.values.map(formatValue).join(', ')
        : 'path matched nothing';
      const counters = f.counterValues
        ? `, ${check.counterPath} → ${f.counterValues.length ? f.counterValues.map(formatValue).join(', ') : 'path matched nothing'}`
        : '';
      const label = f.entryPath ? `${f.key}:${f.entryPath}` : f.key;
      const identity = check.idPath ? `, id → ${f.identity ?? 'missing'}` : '';
      return `${label}${identity} → ${values}${counters}`;
    })
    .join(' ; ');
}

// Counter-based checks compare against the value present when the run armed.
// A missing counter starts at zero so a first-time player's first win counts.
function storageEntryBaseline(check, entry) {
  if (!check.increases) return 0;
  const values = (
    check.counterPath ? (entry.counterValues ?? []) : entry.values
  ).filter(Number.isFinite);
  return values.length ? Math.max(...values) : 0;
}

function matchesStorageEntry(check, entry, baseline = 0) {
  const increased = check.counterPath
    ? entry.counterValues?.some((v) => Number.isFinite(v) && v > baseline)
    : entry.values.some((v) => Number.isFinite(v) && v > baseline);
  if (check.increases && !increased) return false;
  if (check.increases && !check.counterPath) return true;
  return entry.values.some((v) => v === check.equals);
}

// Each slot gets its own stale-result suppression. A historical WIN therefore
// cannot prevent today's separate state from becoming ready and firing.
function createStorageWatch(check) {
  const watch = new Map();
  if (check?.type !== 'storage') return watch;
  for (const entry of collectStorageEntries(check)) {
    watch.set(entry.slot, {
      identity: entry.identity,
      baseline: storageEntryBaseline(check, entry),
      ready: check.increases || !matchesStorageEntry(check, entry),
    });
  }
  return watch;
}

function countDomMatches(check) {
  try {
    return document.querySelectorAll(check.query).length;
  } catch {
    return -1; // invalid selector
  }
}

function findScoreButton(check) {
  if (!check?.query) return null;
  const texts = (Array.isArray(check.text) ? check.text : [check.text])
    .filter((text) => typeof text === 'string')
    .map((text) => text.trim().toLowerCase())
    .filter(Boolean);
  let elements;
  try {
    elements = document.querySelectorAll(check.query);
  } catch {
    warn(`Invalid scoreButton selector "${check.query}"`);
    return null;
  }

  for (const elem of elements) {
    if (typeof elem.checkVisibility === 'function' && !elem.checkVisibility()) {
      continue;
    }
    const labels = [
      elem.innerText,
      elem.textContent,
      elem.getAttribute?.('aria-label'),
      elem.getAttribute?.('title'),
      elem.value,
    ]
      .filter((value) => typeof value === 'string')
      .map((value) => value.replace(/\s+/g, ' ').trim().toLowerCase())
      .filter(Boolean);
    if (texts.length === 0 || texts.some((text) => labels.includes(text))) {
      return elem;
    }
  }
  return null;
}

// Result dialogs can render shortly after a storage-based win is visible.
// Retry briefly, with a per-game override for slower dialogs, then click the
// configured Share control once. The MAIN-world hook captures attempted
// clipboard writes even if browser permission denies the actual background write.
function captureScore(check, attemptsRemaining = check?.attempts ?? 20) {
  if (!check || typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('speedrundle:capture-result'));
  const button = findScoreButton(check);
  if (button) {
    button.click();
    log('Clicked the configured Share button to capture the game result');
    return;
  }
  if (attemptsRemaining > 0) {
    setTimeout(() => captureScore(check, attemptsRemaining - 1), 100);
  } else {
    warn('No visible Share button matched scoreButton; result not captured');
  }
}

// DOM checks only. Storage checks are handled by checkStorageCondition.
function checkCondition(check, mutationType, status) {
  if (!check || check.type === 'storage' || done) return;
  // mutationType null = initial sweep or poll: ignore the configured filter.
  if (mutationType && check.mutationType && check.mutationType !== mutationType)
    return;
  const texts = Array.isArray(check.text) ? check.text : [check.text];
  for (const elem of document.querySelectorAll(check.query)) {
    if (
      elem.checkVisibility() &&
      texts.some((text) => elem.textContent.includes(text))
    ) {
      log(`${status} condition matched ("${check.query}")`);
      sendResult(status);
      return;
    }
  }
}

// Results already on disk at arm time are stale and suppressed per entry.
// Existing entries become eligible after a non-matching state; a new entry or
// a changed daily identity is eligible immediately. Missing entries retain
// their watch state so a temporarily removed stale result cannot rearm itself.
function checkStorageCondition(field, status) {
  const check = puzzleState?.[field];
  if (!check || check.type !== 'storage' || done) return;
  const report = storageReport(check);
  const reportKey = field === 'winCheck' ? 'win' : 'lose';
  if (report !== lastStorageReport[reportKey]) {
    lastStorageReport[reportKey] = report;
    log(`${field} now sees: ${report}`);
  }
  const watch = puzzleState[field === 'winCheck' ? 'winWatch' : 'loseWatch'];
  for (const entry of collectStorageEntries(check)) {
    let watched = watch.get(entry.slot);
    if (!watched) {
      watched = { identity: entry.identity, baseline: 0, ready: true };
      watch.set(entry.slot, watched);
      log(`${field} found new storage entry ${entry.slot}`);
    } else if (entry.identity !== null && entry.identity !== watched.identity) {
      const hadIdentity = watched.identity !== null;
      watched.identity = entry.identity;
      watched.baseline = 0;
      // Learning an initially missing ID is not a new day. Only a transition
      // between two known identities makes a reused object eligible again.
      if (hadIdentity) watched.ready = true;
      log(`${field} daily identity changed at ${entry.slot}`);
    }

    const matched = matchesStorageEntry(check, entry, watched.baseline);
    if (!watched.ready) {
      if (!matched) {
        watched.ready = true;
        log(`${field} cleared at ${entry.slot} — ready to detect new results`);
      }
      continue;
    }
    if (matched) {
      const comparison = check.increases
        ? `${check.counterPath ?? check.path} increased above ${formatValue(watched.baseline)}${check.counterPath ? `; ${check.path} === ${formatValue(check.equals)}` : ''}`
        : `${check.path} === ${formatValue(check.equals)}`;
      log(`${status} storage condition fired at ${entry.slot}: ${comparison}`);
      sendResult(status);
      return;
    }
  }
}

// DOM mutations arrive in bursts (a single render can produce hundreds), and
// each scan runs querySelectorAll for every configured check. Debounce bursts
// into one scan per 50ms. setTimeout rather than requestAnimationFrame so
// detection still fires (throttled) if the puzzle tab is in the background.
function scheduleScan(mutationType) {
  pendingScanTypes.add(mutationType);
  if (scanTimer) return;
  scanTimer = setTimeout(() => {
    scanTimer = null;
    const types = [...pendingScanTypes];
    pendingScanTypes.clear();
    for (const type of types) scan(type);
  }, 50);
}

function scan(mutationType) {
  checkCondition(puzzleState?.winCheck, mutationType, 'WIN');
  checkCondition(puzzleState?.loseCheck, mutationType, 'LOSE');
  // localStorage writes don't fire DOM mutations, so storage checks only run
  // on the initial sweep and the poll.
  if (mutationType === null) {
    checkStorageCondition('winCheck', 'WIN');
    checkStorageCondition('loseCheck', 'LOSE');
  }
}

// Compact every-5s status line so a silent run is diagnosable: is the script
// still alive, what do the storage checks see, how many DOM nodes match.
function logHeartbeat() {
  if (!puzzleState || done) return;
  const parts = [];
  for (const [label, check, watch] of [
    ['win', puzzleState.winCheck, puzzleState.winWatch],
    ['lose', puzzleState.loseCheck, puzzleState.loseWatch],
  ]) {
    if (!check) continue;
    if (check.type === 'storage') {
      const stale = [...watch.values()].filter((entry) => !entry.ready).length;
      parts.push(
        `${label}: storage [${storageReport(check)}]${stale ? ` (${stale} stale ${stale === 1 ? 'entry' : 'entries'} ignored)` : ''}`
      );
    } else {
      const n = countDomMatches(check);
      parts.push(
        `${label}: DOM "${check.query}" → ${n === -1 ? 'INVALID SELECTOR' : `${n} element(s)`}`
      );
    }
  }
  log('still watching —', parts.join(' | '));
}

function arm(puzzle, key) {
  observer?.disconnect();
  clearTimers();
  const winCheck = normalizeStorageCheck(puzzle.winCheck);
  const loseCheck = normalizeStorageCheck(puzzle.loseCheck);
  puzzleState = {
    key,
    winCheck,
    loseCheck,
    scoreButton: puzzle.scoreButton ?? null,
    winWatch: createStorageWatch(winCheck),
    loseWatch: createStorageWatch(loseCheck),
  };
  done = false;
  lastStorageReport = { win: '', lose: '' };
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) scheduleScan(mutation.type);
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  const hasStorage = [winCheck, loseCheck].some((c) => c?.type === 'storage');
  if (hasStorage) pollInterval = setInterval(() => scan(null), 100);
  heartbeatInterval = setInterval(logHeartbeat, 5000);

  log(`Armed for "${puzzle.name}" — ${location.href}`);
  log('winCheck:', JSON.stringify(winCheck));
  log('loseCheck:', JSON.stringify(loseCheck));

  // Surface config problems at arm time rather than letting them fail
  // silently in the background.
  for (const [label, check] of [
    ['winCheck', winCheck],
    ['loseCheck', loseCheck],
  ]) {
    if (!check) {
      log(`${label}: none configured`);
      continue;
    }
    if (check.type === 'storage') {
      const keys = storageKeys(check);
      log(
        `${label}: storage ${check.key ?? check.keyPrefix} — keys present:`,
        keys
      );
      if (keys.length === 0) {
        warn(
          `${label}: no localStorage keys match "${check.key ?? check.keyPrefix}" YET — will keep polling in case the game writes them after load`
        );
      }
    } else {
      const count = countDomMatches(check);
      if (count === -1) {
        warn(`${label}: "${check.query}" is not a valid selector`);
        continue;
      }
      log(
        `${label}: DOM "${check.query}" matches ${count} element(s) right now`
      );
      const samples = [...document.querySelectorAll(check.query)]
        .slice(0, 3)
        .map((el) => el.textContent.replace(/\s+/g, ' ').trim().slice(0, 80));
      if (samples.length) log(`${label}: current text of matches:`, samples);
      if (count === 0) {
        log(`${label}: nothing matches yet — watching for mutations`);
      }
    }
  }

  scan(null); // initial sweep, in case the result is already on screen
}

function disarm() {
  if (puzzleState) log('Disarmed — this page is no longer the current puzzle');
  observer?.disconnect();
  observer = null;
  clearTimers();
  puzzleState = null;
}

// Chrome may have serialized the Svelte array proxy as an object with
// numeric keys. Accept that older format as well as arrays and JSON strings.
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

async function update() {
  try {
    const result = await chrome.storage.local.get([
      'puzzles',
      'currentPuzzle',
      'currentRunId',
    ]);
    if (result.puzzles === undefined || result.currentPuzzle === undefined) {
      log(
        'No run in progress (puzzles/currentPuzzle missing from storage) — standing by'
      );
      disarm();
      return;
    }
    const savedPuzzles = normalizeSavedPuzzles(result.puzzles);
    if (!savedPuzzles) {
      warn('Saved puzzles have an unsupported format:', result.puzzles);
      disarm();
      return;
    }
    const pagePuzzle = savedPuzzles.find((puzzle) =>
      urlMatchesPuzzle(puzzle.url)
    );
    if (pagePuzzle && scorePuzzle?.url !== pagePuzzle.url) {
      scorePuzzle = {
        name: pagePuzzle.name,
        url: pagePuzzle.url,
        runId: null,
        puzzleIndex: null,
      };
    }

    const active = savedPuzzles
      .filter((p) => p.active)
      .sort((a, b) => a.index - b.index);
    const puzzle = active[result.currentPuzzle];
    if (!puzzle) {
      log(
        `currentPuzzle=${result.currentPuzzle} but only ${active.length} active puzzle(s) — run is probably finished, standing by`
      );
      disarm();
      return;
    }
    const urlMatch = urlMatchesPuzzle(puzzle.url);
    log(
      `Current puzzle is "${puzzle.name}" (${puzzle.url}) — URL ${urlMatch ? 'MATCHES' : 'does NOT match'} this page`
    );
    const key = `${result.currentPuzzle}:${result.currentRunId ?? 'no-run'}:${puzzle.url}:${JSON.stringify([puzzle.winCheck, puzzle.loseCheck, puzzle.scoreButton])}`;
    if (urlMatch) {
      scorePuzzle = {
        name: puzzle.name,
        url: puzzle.url,
        runId:
          typeof result.currentRunId === 'string' ? result.currentRunId : null,
        puzzleIndex: result.currentPuzzle,
      };
      if (puzzleState?.key !== key) arm(puzzle, key);
    } else if (
      puzzleState?.key === key &&
      location.origin === new URL(puzzle.url).origin
    ) {
      // Bandle's answer search is a separate /search route in the same SPA.
      // Keep the original baselines and readiness so a result written there
      // still counts, and returning to /daily does not look like a stale win.
      log('Same-origin puzzle route — keeping the detector armed');
    } else {
      disarm();
    }
  } catch (e) {
    warn('update() failed (storage unavailable or extension reloaded?):', e);
    disarm();
  }
}

log(`Content script loaded on ${location.href}`);
update();

// SPA routers use pushState/replaceState, which emit no navigation event.
// Keep this poll active even while disarmed so pages such as Bandle's /menu
// arm the detector after navigating client-side to /daily.
setInterval(() => {
  if (location.href === lastPageUrl) return;
  lastPageUrl = location.href;
  log(`Page URL changed to ${lastPageUrl} — re-evaluating`);
  update();
}, 250);

// Re-evaluate when a run starts or advances while this tab stays open.
chrome.storage.onChanged.addListener((changes, area) => {
  if (
    area === 'local' &&
    (changes.puzzles || changes.currentPuzzle || changes.currentRunId)
  ) {
    log('Puzzle storage changed — re-evaluating');
    update();
  }
});

// clipboard-listener.js runs in the MAIN world and emits the exact text copied
// by a Share/Copy control. Keep scorePuzzle after disarming so the result can
// still be saved when the user returns to a finished puzzle and clicks Share.
if (typeof window !== 'undefined') {
  window.addEventListener('speedrundle:game-result', (event) => {
    sendPuzzleScore(event.detail);
  });
}
