<script>
  import { onMount } from 'svelte';
  import GameCard from '$lib/components/GameCard.svelte';
  import GameRow from '$lib/components/GameRow.svelte';
  import { categoryStyle, STORE_URL } from '$lib/games.js';

  let { data } = $props();

  let query = $state('');
  let activeCategory = $state('All');

  /** @type {'grid' | 'compact'} */
  let view = $state('grid');

  // Restore the saved view preference after hydration (not available during prerender).
  onMount(() => {
    const saved = localStorage.getItem('speedrundle:view');
    if (saved === 'grid' || saved === 'compact') view = saved;
  });

  /** @param {'grid' | 'compact'} mode */
  function setView(mode) {
    view = mode;
    localStorage.setItem('speedrundle:view', mode);
  }

  const filters = $derived([...new Set(['All', ...data.categories])]);

  const matches = $derived(
    data.games.filter((game) => {
      const inCategory = activeCategory === 'All' || game.category === activeCategory;
      if (!inCategory) return false;
      if (!query.trim()) return true;
      const haystack = `${game.name} ${game.publisher} ${game.description}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    })
  );

  /** Category order from the catalogue; unknown categories sort last. */
  /** @param {string} category */
  const orderOf = (category) => {
    const index = data.categories.indexOf(category);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };

  /** Matches grouped by category, in catalogue order — used in the "All" view. */
  const groups = $derived.by(() => {
    if (activeCategory !== 'All') return null;
    const byCategory = new Map();
    for (const game of matches) {
      if (!byCategory.has(game.category)) byCategory.set(game.category, []);
      byCategory.get(game.category).push(game);
    }
    return [...byCategory.entries()]
      .map(([category, games]) => ({ category, games }))
      .sort((a, b) => orderOf(a.category) - orderOf(b.category));
  });
</script>

<svelte:head>
  <title>Speedrundle — Daily Game Catalogue</title>
</svelte:head>

<section class="mb-10 text-center">
  <p class="mb-3 text-xs font-semibold tracking-widest text-amber-400 uppercase">
    Daily puzzle speedruns
  </p>
  <h1 class="font-display mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
    Every daily game. One timed run.
  </h1>
  <p class="mx-auto mt-4 max-w-xl text-zinc-400">
    The Speedrundle extension strings your daily puzzles — Wordle, the Mini, Strands, and more —
    into a single timed run with automatic splits. Every game below is playable in the extension.
  </p>
  <div class="mt-6 flex items-center justify-center gap-3">
    <a
      href={STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      class="rounded-lg bg-amber-400 px-5 py-2.5 font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
    >
      Add to Chrome
    </a>
    <a
      href="#games"
      class="rounded-lg border border-zinc-700 px-5 py-2.5 font-semibold text-zinc-200 transition-colors hover:border-zinc-500"
    >
      Browse games
    </a>
  </div>
</section>

<section id="games">
  <div class="mb-6 flex flex-col gap-4">
    <input
      type="search"
      bind:value={query}
      placeholder="Search games, publishers, descriptions…"
      aria-label="Search games"
      class="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
    />
    <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
      {#each filters as category (category)}
        {@const style = category === 'All' ? null : categoryStyle(category)}
        <button
          type="button"
          onclick={() => (activeCategory = category)}
          aria-pressed={activeCategory === category}
          class={[
            'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
            activeCategory === category
              ? (style?.chipActive ?? 'bg-amber-400 text-zinc-950 hover:bg-amber-300')
              : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
          ]}
        >
          {#if style}
            <span
              class={[
                'h-2 w-2 rounded-full',
                activeCategory === category ? 'bg-zinc-950/70' : style.dot
              ]}
              aria-hidden="true"
            ></span>
          {/if}
          {category}
        </button>
      {/each}
      <span class="ml-auto text-sm text-zinc-500">
        {matches.length}
        {matches.length === 1 ? 'game' : 'games'}
      </span>
      <div class="flex rounded-lg border border-zinc-700 p-0.5" role="group" aria-label="View mode">
        <button
          type="button"
          onclick={() => setView('grid')}
          aria-pressed={view === 'grid'}
          aria-label="Grid view"
          title="Grid view"
          class={[
            'rounded-md p-1.5 transition-colors',
            view === 'grid' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
          ]}
        >
          <svg viewBox="0 0 16 16" class="h-4 w-4" fill="currentColor" aria-hidden="true">
            <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" />
            <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" />
            <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" />
            <rect x="9" y="9" width="5.5" height="5.5" rx="1" />
          </svg>
        </button>
        <button
          type="button"
          onclick={() => setView('compact')}
          aria-pressed={view === 'compact'}
          aria-label="Compact view"
          title="Compact view"
          class={[
            'rounded-md p-1.5 transition-colors',
            view === 'compact' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
          ]}
        >
          <svg viewBox="0 0 16 16" class="h-4 w-4" fill="currentColor" aria-hidden="true">
            <rect x="1.5" y="2" width="13" height="2.5" rx="1" />
            <rect x="1.5" y="6.75" width="13" height="2.5" rx="1" />
            <rect x="1.5" y="11.5" width="13" height="2.5" rx="1" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  {#snippet gameList(/** @type {import('$lib/games.js').Game[]} */ list)}
    {#if view === 'grid'}
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each list as game (game.slug)}
          <GameCard {game} />
        {/each}
      </div>
    {:else}
      <ul class="grid gap-2 sm:grid-cols-2">
        {#each list as game (game.slug)}
          <GameRow {game} />
        {/each}
      </ul>
    {/if}
  {/snippet}

  {#if matches.length === 0}
    <div class="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
      <p class="text-lg font-medium text-zinc-300">No games match your filters.</p>
      <p class="mt-1 text-sm text-zinc-500">Try a different search term or category.</p>
      <button
        type="button"
        onclick={() => {
          query = '';
          activeCategory = 'All';
        }}
        class="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
      >
        Clear filters
      </button>
    </div>
  {:else if groups}
    <div class="space-y-10">
      {#each groups as group (group.category)}
        {@const style = categoryStyle(group.category)}
        <section>
          <h2 class="font-display flex items-center gap-2.5 text-lg font-semibold tracking-tight">
            <span class={['h-2.5 w-2.5 rounded-full', style.dot]} aria-hidden="true"></span>
            <span class={style.text}>{group.category}</span>
            <span class="text-sm font-normal text-zinc-500">{group.games.length}</span>
          </h2>
          <div class="mt-4">
            {@render gameList(group.games)}
          </div>
        </section>
      {/each}
    </div>
  {:else}
    {@render gameList(matches)}
  {/if}
</section>
