console.log("Content script loaded");

const root = document.getRootNode()

function sendWin() {
  chrome.runtime.sendMessage({
    type: 'GAME_FINISHED', 
    data: {
      status: 'WIN'
    }
  });
}
function sendLose() {
  chrome.runtime.sendMessage({
    type: 'GAME_FINISHED', 
    data: {
      status: 'LOSE'
    }
  });
}

chrome.storage.local.get(['puzzles', 'currentPuzzle'], (result) => {
  if (result.puzzles != undefined && result.currentPuzzle != undefined) {
    const currentPuzzle = result.currentPuzzle
    const puzzle = result.puzzles[currentPuzzle]
    const winCheck = puzzle.winCheck
    const loseCheck = puzzle.loseCheck

    const cb = (mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData' && (winCheck.type === 'characterData' || loseCheck.type === 'characterData')) {
          if (mutation.target.data === winCheck.newValue) {
            if ( winCheck.oldValue != undefined || winCheck.oldValue != null)
            {
              if (mutation.target.oldValue === winCheck.oldValue) {
                console.log('Win!')
                sendWin()
              }
            } else {
              console.log('Win!')
              sendWin()
            }
          }

          if (mutation.target.data === loseCheck.newValue) {
            if ( loseCheck.oldValue != undefined || loseCheck.oldValue != null)
            {
              if (mutation.target.oldValue === loseCheck.oldValue) {
                console.log('Lose!')
                sendLose()
              }
            } else {
              console.log('Lose!')
              sendLose()
            }
          }
        }
      });
    };

    const observer = new MutationObserver(cb)
    observer.observe(root, { 
      childList: true, 
      subtree: true, 
      characterData: winCheck.type === 'characterData' || loseCheck.type === 'characterData', 
      characterDataOldValue: winCheck.type === 'characterData' || loseCheck.type === 'characterData', 
    })
  } 
});
