const documRoot = document.getRootNode();
let searching = true;
let observer = null;
let pollInterval = null;

function stopWatching() {
  searching = false;
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

function sendWin() {
  if (!searching) return;
  chrome.runtime.sendMessage({
    type: 'GAME_FINISHED',
    data: {
      status: 'WIN',
    },
  });
  stopWatching();
}

function sendLose() {
  if (!searching) return;
  chrome.runtime.sendMessage({
    type: 'GAME_FINISHED',
    data: {
      status: 'LOSE',
    },
  });
  stopWatching();
}

function matchesDom(check) {
  const texts = check.text
    ? Array.isArray(check.text)
      ? check.text
      : [check.text]
    : [];
  return [...document.querySelectorAll(check.query)].some(
    (el) =>
      el.checkVisibility() &&
      (texts.length === 0 ||
        texts.some((t) => el.textContent.replace(/\s+/g, ' ').includes(t)))
  );
}

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

function matches(check) {
  if (!check) return false;
  if (check.type === 'storage') return matchesStorage(check);
  return matchesDom(check);
}

// This script is registered for all origins, so it loads on every page.
// Bail out immediately unless this is the tab the side panel opened for the
// current puzzle.
async function init() {
  const result = await chrome.storage.local.get([
    'puzzles',
    'currentPuzzle',
    'puzzleTabId',
  ]);
  if (
    result.puzzles == undefined ||
    result.currentPuzzle == undefined ||
    result.puzzleTabId == undefined
  ) {
    return;
  }
  const isPuzzleTab = await chrome.runtime
    .sendMessage({ type: 'IS_PUZZLE_TAB' })
    .catch(() => false);
  if (!isPuzzleTab) return;

  const puzzle = JSON.parse(result.puzzles)
    .filter((p) => p.active)
    .sort((a, b) => a.index - b.index)[result.currentPuzzle];
  if (!puzzle) return;

  const winCheck = puzzle.winCheck;
  const loseCheck = puzzle.loseCheck;

  let pending = false;
  function scheduleCheck() {
    if (!searching || pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      if (!searching) return;
      if (matches(winCheck)) return sendWin();
      if (matches(loseCheck)) return sendLose();
    });
  }

  // Only a DOM check benefits from watching mutations.
  if ([winCheck, loseCheck].some((c) => c && c.type !== 'storage')) {
    observer = new MutationObserver(scheduleCheck);
    observer.observe(documRoot, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });
  }

  // Only a storage check needs polling, since localStorage writes don't fire DOM mutations.
  if ([winCheck, loseCheck].some((c) => c && c.type === 'storage')) {
    pollInterval = setInterval(scheduleCheck, 100);
  }

  // Catch games that load in an already-finished state (before any mutation).
  scheduleCheck();
}

init();
