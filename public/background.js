chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

const CONTENT_SCRIPT_ID = 'speedrundle-puzzle-monitor';
const ALL_ORIGINS = ['*://*/*'];

// Once the user grants the optional host permission (one-time toggle in Game
// Settings), register the content script so it is injected automatically on
// every page load — no chrome.scripting.executeScript calls, no prompts
// during play. The registration persists across browser restarts.
async function syncContentScriptRegistration() {
  const granted = await chrome.permissions
    .contains({ origins: ALL_ORIGINS })
    .catch(() => false);
  const registered = await chrome.scripting
    .getRegisteredContentScripts({ ids: [CONTENT_SCRIPT_ID] })
    .then((scripts) => scripts.length > 0)
    .catch(() => false);

  if (granted && !registered) {
    await chrome.scripting
      .registerContentScripts([
        {
          id: CONTENT_SCRIPT_ID,
          matches: ALL_ORIGINS,
          js: ['content-script.js'],
          runAt: 'document_idle',
        },
      ])
      .catch((error) =>
        console.warn('Speedrundle: failed to register content script:', error)
      );
  } else if (!granted && registered) {
    await chrome.scripting
      .unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] })
      .catch((error) =>
        console.warn('Speedrundle: failed to unregister content script:', error)
      );
  }
}

// Sync on every service worker start and whenever the grant changes.
syncContentScriptRegistration();
chrome.runtime.onStartup.addListener(syncContentScriptRegistration);
chrome.runtime.onInstalled.addListener(syncContentScriptRegistration);
chrome.permissions.onAdded.addListener(syncContentScriptRegistration);
chrome.permissions.onRemoved.addListener(syncContentScriptRegistration);

// The content script is injected into every page, so before monitoring DOM
// changes it asks whether it is running in the tab the side panel opened for
// the current puzzle (puzzleTabId is written to storage by the side panel).
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'IS_PUZZLE_TAB') return;
  chrome.storage.local.get('puzzleTabId').then((result) => {
    sendResponse(result.puzzleTabId != null && result.puzzleTabId === sender.tab?.id);
  });
  return true; // keep the message channel open for the async response
});
