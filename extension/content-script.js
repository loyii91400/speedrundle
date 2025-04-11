console.log("Content script loaded");

const documRoot = document.getRootNode()
let searching = true;

function sendWin() {
  if (searching) {
    chrome.runtime.sendMessage({
      type: 'GAME_FINISHED',
      data: {
        status: 'WIN'
      }
    });
  }
  searching = false;
}
function sendLose() {
  if (searching) {
    chrome.runtime.sendMessage({
      type: 'GAME_FINISHED',
      data: {
        status: 'LOSE'
      }
    });
  }
  searching = false;
}

chrome.storage.local.get(['puzzles', 'currentPuzzle'], (result) => {
  if (result.puzzles != undefined && result.currentPuzzle != undefined) {
    const currentPuzzle = result.currentPuzzle
    const puzzle = result.puzzles.filter(p => p.active).sort((a, b) => a.index - b.index)[currentPuzzle]
    const winCheck = puzzle.winCheck
    const loseCheck = puzzle.loseCheck

    function checkGameCondition(check, mutation, sendFunction, logMessage) {
      if (check.mutationType === '' || mutation.type === check.mutationType) {
        const matches = [];
        const textToCheck = Array.isArray(check.text) ? check.text : [check.text];

        for (const elem of document.querySelectorAll(check.query)) {
          if (textToCheck.some(text => elem.textContent.includes(text))) {
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

    const observer = new MutationObserver(cb)
    observer.observe(documRoot, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
    })
  }
});