<script>
  import generalSettingsStore from '../store/generalSettings.svelte';
</script>

<div class="flex flex-col mb-4">
  <h2 class="text-2xl font-bold flex-grow">Game Settings</h2>
  <div class="flex gap-4 p-2">
    <input
      type="checkbox"
      class="w-4 h-4 accent-amber-400"
      checked={generalSettingsStore.isConfetti}
      onchange={(e) => {
        generalSettingsStore.isConfetti = e.currentTarget.checked;
      }}
    />
    Show Confetti
  </div>
  <div class="flex gap-4 p-2">
    <input
      type="checkbox"
      class="w-4 h-4 accent-amber-400"
      checked={generalSettingsStore.isAllowPause}
      onchange={(e) => {
        generalSettingsStore.isAllowPause = e.currentTarget.checked;
      }}
    />
    Allow Pause
  </div>
  <div class="flex gap-4 p-2">
    <input
      type="checkbox"
      class="w-4 h-4 accent-amber-400"
      checked={generalSettingsStore.isShowGiveUp}
      onchange={(e) => {
        generalSettingsStore.isShowGiveUp = e.currentTarget.checked;
      }}
    />
    Show Give Up Buttons (Closing a Tab will still DNF)
  </div>
</div>
