// Speedrundle win/lose detector.
//
// Registered in manifest.json ("content_scripts"), so Chrome injects this on
// the configured puzzle sites. It arms itself only when this tab shows the
// current puzzle; on any other page it exits immediately.
//
// IMPORTANT: logs from this file go to the DevTools console of the PAGE this
// script runs on (the puzzle tab) — never to the extension's service worker
// console. Filter the page console by "[Speedrundle]".

const TAG = '[Speedrundle]';

let puzzleState = null; // { key, winCheck, loseCheck, winReady, loseReady }
let observer = null;
let pollInterval = null;
let heartbeatInterval = null;
let lastStorageReport = { win: '', lose: '' };
let done = false;

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
}

function sendResult(status) {
  if (done) return;
  done = true;
  observer?.disconnect();
  observer = null;
  clearTimers();
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
// array element / object value, e.g. "states.*.data.status". Returns every
// value found at the end of the path.
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

// Storage checks read values the game itself writes to localStorage (shared
// with content scripts). `key` reads one entry; `keyPrefix` scans every entry
// whose key starts with the prefix (NYT keys end with the user id, e.g.
// "games-state-wordleV2/ANON").
function storageKeys(check) {
  if (check.key) return [check.key];
  if (check.keyPrefix) {
    return Object.keys(localStorage).filter((k) => k.startsWith(check.keyPrefix));
  }
  return [];
}

// All values a storage check currently sees, for matching and for logging.
function collectStorageValues(check) {
  const out = [];
  for (const key of storageKeys(check)) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    try {
      out.push({ key, values: readPath(JSON.parse(raw), check.path.split('.')) });
    } catch (e) {
      out.push({ key, values: [], error: String(e) });
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
  const found = collectStorageValues(check);
  if (found.length === 0) return 'no localStorage keys match yet';
  return found
    .map((f) =>
      f.error
        ? `${f.key} → parse error: ${f.error}`
        : `${f.key} → ${f.values.length ? f.values.map(formatValue).join(', ') : 'path matched nothing'}`
    )
    .join(' ; ');
}

function matchesStorage(check) {
  return collectStorageValues(check).some((f) =>
    f.values.some((v) => v === check.equals)
  );
}

function isStorageMatch(check) {
  return !!check && check.type === 'storage' && matchesStorage(check);
}

function countDomMatches(check) {
  try {
    return document.querySelectorAll(check.query).length;
  } catch {
    return -1; // invalid selector
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

// A storage result that was already on disk when the page loaded is stale
// (e.g. yesterday's finished game still in storage) and must clear once
// before a match can fire — otherwise yesterday's WIN would instantly split
// today's run. A game finished during this session always passes through a
// non-matching state first, so real results are unaffected.
function checkStorageCondition(field, status) {
  const check = puzzleState?.[field];
  if (!check || check.type !== 'storage' || done) return;
  const report = storageReport(check);
  const reportKey = field === 'winCheck' ? 'win' : 'lose';
  if (report !== lastStorageReport[reportKey]) {
    lastStorageReport[reportKey] = report;
    log(`${field} now sees: ${report}`);
  }
  const matched = matchesStorage(check);
  const readyField = field === 'winCheck' ? 'winReady' : 'loseReady';
  if (!puzzleState[readyField]) {
    if (!matched) {
      puzzleState[readyField] = true;
      log(`${field} cleared — ready to detect new results`);
    }
    return;
  }
  if (matched) {
    log(
      `${status} storage condition fired: ${check.path} === ${formatValue(check.equals)}`
    );
    sendResult(status);
  }
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
  for (const [label, check, ready] of [
    ['win', puzzleState.winCheck, puzzleState.winReady],
    ['lose', puzzleState.loseCheck, puzzleState.loseReady],
  ]) {
    if (!check) continue;
    if (check.type === 'storage') {
      parts.push(
        `${label}: storage [${storageReport(check)}]${ready ? '' : ' (waiting for stale result to clear)'}`
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
  puzzleState = {
    key,
    winCheck: puzzle.winCheck,
    loseCheck: puzzle.loseCheck,
    winReady: !isStorageMatch(puzzle.winCheck),
    loseReady: !isStorageMatch(puzzle.loseCheck),
  };
  done = false;
  lastStorageReport = { win: '', lose: '' };
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) scan(mutation.type);
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  const hasStorage = [puzzle.winCheck, puzzle.loseCheck].some(
    (c) => c?.type === 'storage'
  );
  if (hasStorage) pollInterval = setInterval(() => scan(null), 100);
  heartbeatInterval = setInterval(logHeartbeat, 5000);

  log(`Armed for "${puzzle.name}" — ${location.href}`);
  log('winCheck:', JSON.stringify(puzzle.winCheck));
  log('loseCheck:', JSON.stringify(puzzle.loseCheck));

  // Surface config problems at arm time rather than letting them fail
  // silently in the background.
  for (const [label, check] of [
    ['winCheck', puzzle.winCheck],
    ['loseCheck', puzzle.loseCheck],
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
      log(`${label}: DOM "${check.query}" matches ${count} element(s) right now`);
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

async function update() {
  try {
    const result = await chrome.storage.local.get([
      'puzzles',
      'currentPuzzle',
    ]);
    if (result.puzzles === undefined || result.currentPuzzle === undefined) {
      log('No run in progress (puzzles/currentPuzzle missing from storage) — standing by');
      disarm();
      return;
    }
    const active = JSON.parse(result.puzzles)
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
    if (urlMatch) {
      const key = `${result.currentPuzzle}:${puzzle.url}`;
      if (puzzleState?.key !== key) arm(puzzle, key);
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

// Re-evaluate when a run starts or advances while this tab stays open.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.puzzles || changes.currentPuzzle)) {
    log('Puzzle storage changed — re-evaluating');
    update();
  }
});
