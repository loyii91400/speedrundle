<script>
  import generalSettingsStore from '../store/generalSettings.svelte';
</script>

<div class="flex flex-col mb-4">
  <h2 class="text-2xl font-bold flex-grow">Other Settings</h2>
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
      checked={generalSettingsStore.isConfetti}
      onchange={(e) => {
        generalSettingsStore.isShowGiveUp = e.target.checked;
      }}
    />
    Show Give Up Buttons (Closing a Tab will still DNF)
  </div>
</div>
