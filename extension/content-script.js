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

    const cb = (mutations) => {
      if (!searching) return;
      mutations.forEach((mutation) => {
        if (mutation.type === winCheck.mutationType) {
          const matches = [];

          for (const elem of document.querySelectorAll(winCheck.query)) {
            if (elem.textContent.includes(winCheck.text)) {
              matches.push(elem);
            }
          }

          if (matches.length > 0) {
            console.log('Win!')
            sendWin()
          }
        } else if (winCheck.mutationType === '') {
          const matches = [];

          for (const elem of document.querySelectorAll(winCheck.query)) {
            if (elem.textContent.includes(winCheck.text)) {
              matches.push(elem);
            }
          }

          if (matches.length > 0) {
            console.log('Win!')
            sendWin()
          }  
        }

        if (loseCheck !== null && mutation.type === loseCheck.mutationType) {
          const matches = [];

          console.log(loseCheck.query)
          console.log(loseCheck.text)
          for (const elem of document.querySelectorAll(loseCheck.query)) {
            if (elem.textContent.includes(loseCheck.text)) {
              matches.push(elem);
            }
          }
          console.log(matches)

          if (matches.length > 0) {
            console.log('Lose!')
            sendLose()
          }
        } else if (loseCheck !== null && loseCheck.mutationType === '') {
          const matches = [];
          
          for (const elem of document.querySelectorAll(loseCheck.query)) {
            if (elem.textContent.includes(loseCheck.text)) {
              matches.push(elem);
            }
          }

          if (matches.length > 0) {
            console.log('Lose!')
            sendLose()
          }
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