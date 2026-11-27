import puzzlesStore from './store/puzzles.svelte.js';
import nextPuzzleStore from './store/nextPuzzle.svelte.js';
import currentRunStore from './store/currentRun.svelte.js';

try {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GAME_FINISHED') {
      if (message.data.status === 'WIN') {
        console.log('Win!');
        puzzlesStore.incrementCurrentPuzzle();
        nextPuzzleStore.nextPuzzle = true;
      } else if (message.data.status === 'LOSE') {
        console.log('Lose!');
        puzzlesStore.incrementCurrentPuzzle();
        nextPuzzleStore.nextPuzzle = true;
        nextPuzzleStore.dnf = true;
      }
      sendResponse({ status: 'received' });
    } else if (message.type === 'PUZZLE_SCORE') {
      currentRunStore.addScore(message.data);
      sendResponse({ status: 'received' });
    }
  });
} catch (error) {
  console.error(error);
}
