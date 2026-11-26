<script>
  import { categoryStyle } from '$lib/games.js';

  /** @type {{ game: import('$lib/games.js').Game }} */
  let { game } = $props();
</script>

<article
  class="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-zinc-600"
>
  <div class="flex items-start justify-between gap-3">
    <a href={game.url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-3">
      <img
        src={game.icon}
        alt="{game.name} icon"
        width="44"
        height="44"
        loading="lazy"
        class="h-11 w-11 rounded-xl bg-zinc-800 object-cover"
      />
      <div>
        <h2 class="font-display text-lg font-semibold tracking-tight group-hover:text-amber-300">
          {game.name}
        </h2>
        <p class="text-xs text-zinc-500">{game.publisher}</p>
      </div>
    </a>
    <span
      class={[
        'shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        categoryStyle(game.category).badge
      ]}
    >
      {game.category}
    </span>
  </div>

  <p class="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{game.description}</p>

  <div class="mt-4 flex items-center gap-2">
    <a
      href={game.url}
      target="_blank"
      rel="noopener noreferrer"
      class="rounded-lg bg-amber-400 px-3.5 py-1.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
    >
      Play ↗
    </a>
  </div>
</article>
