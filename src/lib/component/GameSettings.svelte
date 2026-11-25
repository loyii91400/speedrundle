<script>
  import generalSettingsStore from '../store/generalSettings.svelte';
  import { onMount } from 'svelte';

  let hasSiteAccess = $state(false);

  async function refreshSiteAccess() {
    hasSiteAccess = await chrome.permissions.contains({
      origins: ['*://*/*'],
    });
  }

  onMount(() => {
    refreshSiteAccess();
    chrome.permissions.onAdded.addListener(refreshSiteAccess);
    chrome.permissions.onRemoved.addListener(refreshSiteAccess);
    return () => {
      chrome.permissions.onAdded.removeListener(refreshSiteAccess);
      chrome.permissions.onRemoved.removeListener(refreshSiteAccess);
    };
  });

  async function toggleSiteAccess(e) {
    if (e.target.checked) {
      // chrome.permissions.request must run inside a user gesture;
      // the checkbox change qualifies. This prompts exactly once.
      hasSiteAccess = await chrome.permissions.request({
        origins: ['*://*/*'],
      });
      e.target.checked = hasSiteAccess;
    } else {
      await chrome.permissions.remove({ origins: ['*://*/*'] });
      hasSiteAccess = false;
    }
  }
</script>

<div class="flex flex-col mb-4">
  <h2 class="text-2xl font-bold flex-grow">Game Settings</h2>
  <div class="flex gap-4 p-2">
    <input
      type="checkbox"
      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
      checked={generalSettingsStore.isConfetti}
      onchange={(e) => {
        generalSettingsStore.isConfetti = e.target.checked;
      }}
    />
    Show Confetti
  </div>
  <div class="flex gap-4 p-2">
    <input
      type="checkbox"
      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
      checked={generalSettingsStore.isAllowPause}
      onchange={(e) => {
        generalSettingsStore.isAllowPause = e.target.checked;
      }}
    />
    Allow Pause
  </div>
  <div class="flex gap-4 p-2">
    <input
      type="checkbox"
      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
      checked={generalSettingsStore.isShowGiveUp}
      onchange={(e) => {
        generalSettingsStore.isShowGiveUp = e.target.checked;
      }}
    />
    Show Give Up Buttons (Closing a Tab will still DNF)
  </div>
  <div class="flex gap-4 p-2">
    <input
      type="checkbox"
      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
      checked={hasSiteAccess}
      onchange={toggleSiteAccess}
    />
    Allow access to puzzle sites (required once to detect wins)
  </div>
</div>
