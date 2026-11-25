const documRoot = document.getRootNode();
let searching = true;

function sendWin() {
  if (!searching) return;
  chrome.runtime.sendMessage({
    type: 'GAME_FINISHED',
    data: {
      status: 'WIN',
    },
  });
  searching = false;
}
function sendLose() {
  if (!searching) return;
  chrome.runtime.sendMessage({
    type: 'GAME_FINISHED',
    data: {
      status: 'LOSE',
    },
  });
  searching = false;
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

  const currentPuzzle = result.currentPuzzle;
  const puzzle = JSON.parse(result.puzzles)
    .filter((p) => p.active)
    .sort((a, b) => a.index - b.index)[currentPuzzle];
  if (!puzzle) return;
  const winCheck = puzzle.winCheck;
  const loseCheck = puzzle.loseCheck;

  function checkGameCondition(check, mutation, sendFunction, logMessage) {
    if (check.mutationType === '' || mutation.type === check.mutationType) {
      const matches = [];
      const textToCheck = Array.isArray(check.text)
        ? check.text
        : [check.text];

      for (const elem of document.querySelectorAll(check.query)) {
        if (
          elem.checkVisibility() &&
          textToCheck.some((text) => elem.textContent.includes(text))
        ) {
          matches.push(elem);
        }
      }

      if (matches.length > 0) {
        console.log(logMessage + '!');
        sendFunction();
      }
    }
  }

  const cb = (mutations) => {
    if (!searching) return;
    mutations.forEach((mutation) => {
      checkGameCondition(winCheck, mutation, sendWin, 'Win');
      if (loseCheck !== null) {
        checkGameCondition(loseCheck, mutation, sendLose, 'Lose');
      }
    });
  };

  const observer = new MutationObserver(cb);
  observer.observe(documRoot, {
    childList: true,
    subtree: true,
    characterData: true,
    characterDataOldValue: true,
  });
}

init();
