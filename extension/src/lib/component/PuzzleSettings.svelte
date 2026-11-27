<script>
  import { onMount } from 'svelte';
  import puzzlesStore from '../store/puzzles.svelte';
  import { fetchPuzzles } from '../puzzleFetcher.js';
  import GameSettings from './GameSettings.svelte';

  let puzzles = $derived(puzzlesStore.puzzles);
  /** @type {string | null} */
  let error = $state(null);

  let query = $state('');
  let activeCategory = $state('All');

  // Categories in catalogue order (first appearance), for the filter chips.
  const categories = $derived([
    ...new Set(puzzles.map((p) => p.category).filter((c) => c !== undefined)),
  ]);

  const filtered = $derived(
    puzzles.filter((puzzle) => {
      if (activeCategory !== 'All' && puzzle.category !== activeCategory)
        return false;
      if (!query.trim()) return true;
      const haystack =
        `${puzzle.name} ${puzzle.publisher ?? ''} ${puzzle.category ?? ''}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    })
  );

  const enabledCount = $derived(puzzles.filter((p) => p.active).length);

  /** Enable/disable every puzzle in the current filtered view at once. */
  /** @param {boolean} active */
  function setAllFiltered(active) {
    const shown = new Set(filtered);
    puzzlesStore.puzzles = puzzlesStore.puzzles.map((p) =>
      shown.has(p) ? { ...p, active } : p
    );
  }

  onMount(async () => {
    const result = await fetchPuzzles();
    error = result.error;
  });
</script>

<div class="p-4">
  <GameSettings />

  <h2 class="font-display text-2xl font-bold tracking-tight">
    Puzzle Settings
  </h2>
  <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
    Choose the puzzles in your run — {enabledCount} of {puzzles.length} enabled.
  </p>

  {#if error}
    <pre class="mb-4 text-sm whitespace-pre-wrap text-rose-500">{error}</pre>
  {/if}

  {#if puzzles.length > 0}
    <div class="mt-4 flex flex-col gap-3">
      <input
        type="search"
        bind:value={query}
        placeholder="Search puzzles, publishers, categories…"
        aria-label="Search puzzles"
        class="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
      <div
        class="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter by category"
      >
        {#each ['All', ...categories] as category (category)}
          <button
            type="button"
            onclick={() => (activeCategory = category)}
            aria-pressed={activeCategory === category}
            class={[
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              activeCategory === category
                ? 'bg-amber-400 text-zinc-950'
                : 'border border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200',
            ]}
          >
            {category}
          </button>
        {/each}
        <div class="ml-auto flex gap-1 text-xs">
          <button
            type="button"
            class="cursor-pointer rounded-md px-2 py-1 font-medium text-amber-600 hover:bg-amber-400/10 dark:text-amber-400"
            title="Enable every puzzle currently shown"
            onclick={() => setAllFiltered(true)}>Enable all</button
          >
          <button
            type="button"
            class="cursor-pointer rounded-md px-2 py-1 font-medium text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
            title="Disable every puzzle currently shown"
            onclick={() => setAllFiltered(false)}>Disable all</button
          >
        </div>
      </div>
    </div>

    <div
      class="mt-3 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      {#if filtered.length > 0}
        <ul class="divide-y divide-zinc-200 dark:divide-zinc-800">
          {#each filtered as puzzle (puzzle.url)}
            <li
              class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            >
              <input
                type="checkbox"
                class="h-4 w-4 shrink-0 accent-amber-400"
                checked={puzzle.active}
                aria-label="Include {puzzle.name} in your run"
                onchange={(e) => {
                  puzzlesStore.puzzles = puzzlesStore.puzzles.map((p) =>
                    p === puzzle ? { ...p, active: e.currentTarget.checked } : p
                  );
                }}
              />
              <img
                width="32"
                height="32"
                src={puzzle.icon}
                alt={puzzle.name}
                class="rounded-lg"
              />
              <div class="min-w-0 flex-1">
                <div
                  class="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  {puzzle.name}
                </div>
                {#if puzzle.publisher}
                  <div
                    class="truncate text-xs text-zinc-500 dark:text-zinc-400"
                  >
                    {puzzle.publisher}
                  </div>
                {/if}
              </div>
              {#if puzzle.category}
                <span
                  class="shrink-0 rounded-full border border-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                >
                  {puzzle.category}
                </span>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <div class="py-8 text-center">
          <p class="text-sm text-zinc-500 dark:text-zinc-400">
            No puzzles match your filters.
          </p>
          <button
            type="button"
            class="mt-3 cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
            onclick={() => {
              query = '';
              activeCategory = 'All';
            }}
          >
            Clear filters
          </button>
        </div>
      {/if}
    </div>
  {:else}
    <p class="py-4 text-center text-zinc-500 italic dark:text-zinc-400">
      Loading puzzles...
    </p>
  {/if}
</div>
