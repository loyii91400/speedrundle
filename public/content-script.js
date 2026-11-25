// Speedrundle win/lose detector.
//
// Registered in manifest.json ("content_scripts"), so Chrome injects this on
// every page load. It arms itself only when this tab shows the current
// puzzle; on any other page it exits immediately.
//
// IMPORTANT: logs from this file go to the DevTools console of the PAGE this
// script runs on (the puzzle tab) — never to the extension's service worker
// console. Filter the page console by "[Speedrundle]".

const TAG = '[Speedrundle]';

let puzzleState = null; // { key, winCheck, loseCheck }
let observer = null;
let pollInterval = null;
let done = false;

function log(...args) {
  console.log(TAG, ...args);
}

function sendResult(status) {
  if (done) return;
  done = true;
  observer?.disconnect();
  observer = null;
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  log(`${status} detected — notifying the side panel`);
  try {
    chrome.runtime
      .sendMessage({ type: 'GAME_FINISHED', data: { status } })
      .catch(() => {
        // Side panel closed — nothing listening.
      });
  } catch {
    // Extension context invalidated (e.g. extension reloaded) — ignore.
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
  } catch {
    return false;
  }
}

// Storage checks read a value the game itself writes to localStorage (shared
// with content scripts), e.g. Wordle's nyt-wordle-state gameStatus.
function matchesStorage(check) {
  try {
    const raw = localStorage.getItem(check.key);
    if (raw === null) return false;
    let value = JSON.parse(raw);
    for (const key of check.path.split('.')) {
      value = value?.[key];
    }
    return value === check.equals;
  } catch {
    return false;
  }
}

function checkCondition(check, mutationType, status) {
  if (!check || done) return;
  if (check.type === 'storage') {
    if (matchesStorage(check)) {
      log(`${status} condition matched (storage "${check.key}")`);
      sendResult(status);
    }
    return;
  }
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

function scan(mutationType) {
  checkCondition(puzzleState?.winCheck, mutationType, 'WIN');
  checkCondition(puzzleState?.loseCheck, mutationType, 'LOSE');
}

function arm(puzzle, key) {
  observer?.disconnect();
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  puzzleState = { key, winCheck: puzzle.winCheck, loseCheck: puzzle.loseCheck };
  done = false;
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) scan(mutation.type);
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  // localStorage writes don't fire DOM mutations, so storage checks poll.
  if ([puzzle.winCheck, puzzle.loseCheck].some((c) => c?.type === 'storage')) {
    pollInterval = setInterval(() => scan(null), 100);
  }
  log(`Watching "${puzzle.name}" on ${location.href}`);
  scan(null); // initial sweep, in case the result is already on screen
}

function disarm() {
  observer?.disconnect();
  observer = null;
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  puzzleState = null;
}

async function update() {
  try {
    const result = await chrome.storage.local.get([
      'puzzles',
      'currentPuzzle',
    ]);
    if (result.puzzles === undefined || result.currentPuzzle === undefined) {
      disarm();
      return;
    }
    const puzzle = JSON.parse(result.puzzles)
      .filter((p) => p.active)
      .sort((a, b) => a.index - b.index)[result.currentPuzzle];
    if (puzzle && urlMatchesPuzzle(puzzle.url)) {
      const key = `${result.currentPuzzle}:${puzzle.url}`;
      if (puzzleState?.key !== key) arm(puzzle, key);
    } else {
      disarm();
    }
  } catch {
    // Storage unavailable or extension context invalidated.
    disarm();
  }
}

log(`Content script loaded on ${location.href}`);
update();

// Re-evaluate when a run starts or advances while this tab stays open.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.puzzles || changes.currentPuzzle)) {
    update();
  }
});
