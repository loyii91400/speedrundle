<script>
    import { onMount } from "svelte";
    import puzzlesStore from "../store/puzzles.svelte";
    import { fetchPuzzles } from "../puzzleFetcher.js";
    import sourceUrlsStore from "../store/sourceUrls.svelte";

    let puzzles = $derived(puzzlesStore.puzzles);
    let error = $state(null);
    let showUrlInput = $state(false);
    let urls = $state(sourceUrlsStore.sourceUrls);

    onMount(async () => {
        const result = await fetchPuzzles(urls);
        error = result.error;
    });
</script>

<div class="p-4">
  <div class="flex items-center mb-4">
    <h2 class="text-2xl font-bold flex-grow">Puzzle Settings</h2>
    <span class="text-sm text-gray-600 mr-2">Advanced settings</span>
    <button 
      class="text-gray-600 hover:text-gray-800 focus:outline-none"
      onclick={() => showUrlInput = !showUrlInput}
      aria-label="Toggle URL input visibility"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        class="h-6 w-6 transition-transform {showUrlInput ? 'rotate-180' : ''}" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M19 9l-7 7-7-7" 
        />
      </svg>
    </button>
  </div>

  {#if showUrlInput}
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2" for="urls">
        Puzzle URLs (one per line)
      </label>
      <textarea
        id="urls"
        bind:value={urls}
        class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter URLs, one per line"
      ></textarea>
      <button 
        onclick={async () => {
            sourceUrlsStore.sourceUrls = urls;
            const result = await fetchPuzzles(urls);
            error = result.error;
        }}
        class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Fetch Puzzles
      </button>
    </div>
  {/if}
  
  {#if error}
    <pre class="text-red-500 mb-4 text-sm whitespace-pre-wrap">{error}</pre>
  {/if}

  {#if puzzles.length > 0}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each puzzles as puzzle}
          <li class="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div class="flex items-center space-x-3">
              <input
                type="checkbox"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                checked={puzzle.active}
                onchange={(e) => {
                  puzzlesStore.puzzles = puzzlesStore.puzzles.map((p) => p === puzzle ? { ...p, active: e.target.checked } : p);
                }}
              />
      <img width="32" height="32" src={puzzle.icon} alt={puzzle.name} />
              <span class="text-gray-800 dark:text-gray-200">{puzzle.name}</span>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <p class="text-gray-500 dark:text-gray-400 text-center italic py-4">Loading puzzles...</p>
  {/if}
</div>