// @class puzzle 
// @field name string - The name of the puzzle
// @field sourceUrl string - The url of the source of the puzzle
// @field url string - The url to the puzzle
// @field icon string - The url to the icon
// @field active boolean - Whether the puzzle is active
// @field index number - The index of the puzzle
// @field winCheck { mutationType: string, query: string, text: string[] } - The win check configuration
// @field loseCheck { mutationType: string, query: string, text: string[] } | null - The lose check configuration

// Configuration flag to determine storage method
export const isDebug = import.meta.env.DEV; // Set this based on your debug environment

// Initial puzzle list
const initialPuzzles = [];

function createPuzzles() {
  let puzzles = $state(initialPuzzles);
  let currentPuzzle = $state(0);

  return {
    get puzzles() {
      return puzzles;
    },
    get activePuzzles() {
      return puzzles.filter(p => p.active).sort((a, b) => a.index - b.index);
    },
    set puzzles(value) {
      puzzles = value;
      if (puzzles.length > 0) {
        this.save();
      }
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
        console.log('saving', puzzles, currentPuzzle)
        chrome.storage.local.set({ puzzles: Array.from(puzzles) });
        chrome.storage.local.set({ currentPuzzle });
      }
    }
  };
}

const puzzlesStore = createPuzzles();
export default puzzlesStore