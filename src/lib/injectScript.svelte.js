import puzzlesStore from './store/puzzles.svelte.js';

try {
    // chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    //     if (changeInfo.status === 'loading') {
    //         console.log(tab.url)
    //         // if (tab.url.includes(puzzlesStore.activePuzzles[puzzlesStore.currentPuzzle].url)) {
    //         chrome.scripting.executeScript({
    //             target: { tabId: tabId },
    //             files: ['content-script.js']
    //         });
    //         // }
    //     }
    // });
    // chrome.tabs.onCreated.addListener((tab) => {
    //     console.log(tab)
    //     if (tab.url.includes(puzzlesStore.activePuzzles[puzzlesStore.currentPuzzle].url)) {
            
    //     }
    // });
} catch (error) {
    console.error(error);
}