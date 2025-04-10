import puzzlesStore from './store/puzzles.svelte.js';

try {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete') {
            if (tab.url.includes(puzzlesStore.puzzles[puzzlesStore.currentPuzzle].url))
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content-script.js']
            });
        }
    });
} catch (error) {
    console.error(error);
}