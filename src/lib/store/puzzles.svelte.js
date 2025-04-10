// @class puzzle 
// @field name string - The name of the puzzle
// @field url string - The url to the puzzle
// @field icon string - The url to the icon
// @field winCheck { type: string, newValue: string, oldValue?: string | null } - The win check configuration
// @field loseCheck { type: string, newValue: string, oldValue?: string | null } - The win check configuration

// Configuration flag to determine storage method
export const isDebug = import.meta.env.DEV; // Set this based on your debug environment

// Initial puzzle list
const initialPuzzles = [{
  name: 'Wordle',
  url: 'https://web.archive.org/web/20250409011241/https://www.nytimes.com/games/wordle/index.html',
  // url: 'https://www.nytimes.com/games/wordle/index.html',
  icon: 'https://www.nytimes.com/games-assets/v2/metadata/wordle-apple-touch-icon.png?v=v2504091145',
  winCheck: { type: 'characterData', newValue: 'Congratulations!', oldValue: null },
  loseCheck: { type: 'characterData', newValue: 'Thanks for playing today!', oldValue: null }
},{
  name: 'Wordle',
  url: 'https://web.archive.org/web/20250407092409/https://www.nytimes.com/games/wordle/index.html',
  // url: 'https://www.nytimes.com/games/wordle/index.html',
  icon: 'https://www.nytimes.com/games-assets/v2/metadata/wordle-apple-touch-icon.png?v=v2504091145',
  winCheck: { type: 'characterData', newValue: 'Congratulations!', oldValue: null },
  loseCheck: { type: 'characterData', newValue: 'Thanks for playing today!', oldValue: null }
}];
// const initialPuzzles = [];

function createPuzzles() {
  let puzzles = $state(initialPuzzles);
  let currentPuzzle = $state(0);

  return {
    get puzzles() {
      return puzzles;
    },
    get currentPuzzle() {
      return currentPuzzle;
    },
    setCurrentPuzzle(value) {
      currentPuzzle = value;
      this.save();
    },
    incrementCurrentPuzzle() {
      currentPuzzle++;
      this.save();
    },
    resetCurrentPuzzle() {
      currentPuzzle = 0;
      this.save();
    },
    addPuzzle: (puzzle) => {
      puzzles = [...puzzles, puzzle];
      this.save();
    },
    removePuzzle: (puzzleUrl) => {
      puzzles = puzzles.filter(p => p.url !== puzzleUrl);
      this.save();
    },
    clearPuzzles: () => {
      puzzles = [];
      this.save();
    },
    load: () => {
      if (isDebug) {
        const savedPuzzles = localStorage.getItem('puzzles');
        if (savedPuzzles) {
          puzzles = JSON.parse(savedPuzzles);
        }
      } else {
        chrome.storage.local.get(['puzzles', 'currentPuzzle'], (result) => {
          if (result.puzzles) {
            puzzles = result.puzzles;
          }
        });
      }
    },
    save: () => {
      if (isDebug) {
        localStorage.setItem('puzzles', JSON.stringify(puzzles));
      } else {
chrome.storage.local.set({ puzzles: Array.from(puzzles) });
        chrome.storage.local.set({ currentPuzzle });
      }
    }
  };
}

const puzzlesStore = createPuzzles();
// puzzlesStore.load();
puzzlesStore.save();
export default puzzlesStore