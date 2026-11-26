<script>
  import { onMount } from 'svelte';
  import puzzlesStore from '../store/puzzles.svelte';
  import { fetchPuzzles } from '../puzzleFetcher.js';
  import GameSettings from './GameSettings.svelte';

  let puzzles = $derived(puzzlesStore.puzzles);
  let error = $state(null);

  onMount(async () => {
    const result = await fetchPuzzles();
    error = result.error;
  });
</script>

<div class="p-4">
  <GameSettings />

  <h2 class="text-2xl font-bold flex-grow">Puzzle Settings</h2>

  {#if error}
    <pre class="text-red-500 mb-4 text-sm whitespace-pre-wrap">{error}</pre>
  {/if}

  {#if puzzles.length > 0}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each puzzles as puzzle}
          <li
            class="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="flex items-center space-x-3">
              <input
                type="checkbox"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                checked={puzzle.active}
                onchange={(e) => {
                  puzzlesStore.puzzles = puzzlesStore.puzzles.map((p) =>
                    p === puzzle ? { ...p, active: e.target.checked } : p
                  );
                }}
              />
              <img width="32" height="32" src={puzzle.icon} alt={puzzle.name} />
              <span class="text-gray-800 dark:text-gray-200">{puzzle.name}</span
              >
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <p class="text-gray-500 dark:text-gray-400 text-center italic py-4">
      Loading puzzles...
    </p>
  {/if}
</div>
