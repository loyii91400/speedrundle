<script>
    import { onMount } from "svelte";
  import puzzlesStore from "../store/puzzles.svelte";

  let puzzles = $derived(puzzlesStore.puzzles);
  let error = $state(null);
  let urls = $state('https://raw.githubusercontent.com/loyii91400/wordleTest/refs/heads/main/links.json');
  let showUrlInput = $state(false);

  async function fetchPuzzles() {
    try {
      error = null;
      const urlList = urls.split('\n').filter(url => url.trim());
      
      // Create a new array to store all fetched puzzles
      let newPuzzlesArray = [];
      
      // Fetch puzzles from all URLs
      for (const url of urlList) {
        try {
          const response = await fetch(url.trim());
          if (!response.ok) throw new Error(`Failed to fetch from ${url}`);
          const fetchedPuzzles = await response.json();
          
          // Add sourceUrl to each puzzle
          const puzzlesWithSource = fetchedPuzzles.map(puzzle => ({ 
            ...puzzle, 
            sourceUrl: url.trim() 
          }));
          
          newPuzzlesArray.push(...puzzlesWithSource);
        } catch (e) {
          error = (error ? error + '\n' : '') + `Error fetching ${url}`;
        }
      }
      
      // Update active status based on current puzzles
      newPuzzlesArray = newPuzzlesArray.map(newPuzzle => {
        // Find a matching puzzle in the current store
        const existingPuzzle = puzzlesStore.puzzles.find(p => 
          p.name === newPuzzle.name && p.url === newPuzzle.url
        );
        
        // If a matching puzzle exists, preserve its active status
        return existingPuzzle ? { ...newPuzzle, active: existingPuzzle.active } : { ...newPuzzle, active: true };
      });
      
      // Remove duplicates and set as new puzzles
      puzzlesStore.puzzles = newPuzzlesArray.filter((puzzle, index, self) => 
        index === self.findIndex(p => p.name === puzzle.name && p.url === puzzle.url)
      );
    } catch (e) {
      error = e.message;
    }
  }

  onMount(() => {
    fetchPuzzles();
  });
</script>

<div class="p-4">
  <div class="flex items-center mb-4">
    <h2 class="text-2xl font-bold flex-grow">Puzzle Settings</h2>
    <span class="text-sm text-gray-600 mr-2">Advanced settings</span>
    <button 
      class="text-gray-600 hover:text-gray-800 focus:outline-none"
      onclick={() => showUrlInput = !showUrlInput}
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
        onclick={fetchPuzzles}
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
    <ul class="space-y-2">
      {#each puzzles as puzzle}
        <li class="py-2 border-b border-gray-200 last:border-0 flex items-center gap-3">
          <input
            type="checkbox"
            class="w-4 h-4 text-blue-600"
            checked={puzzle.active}
            onchange={(e) => {
              puzzlesStore.puzzles = puzzlesStore.puzzles.map((p) => p === puzzle ? { ...p, active: e.target.checked } : p);
            }}
          />
          <span>{puzzle.name}</span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="text-gray-500">Loading puzzles...</p>
  {/if}
</div>