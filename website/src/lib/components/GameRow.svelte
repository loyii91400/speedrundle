<script>
  import { categoryStyle } from '$lib/games.js';

  /** @type {{ game: import('$lib/games.js').Game }} */
  let { game } = $props();
</script>

<li
  class="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 transition-colors hover:border-zinc-600"
>
  <img
    src={game.icon}
    alt=""
    width="32"
    height="32"
    loading="lazy"
    class="h-8 w-8 shrink-0 rounded-lg bg-zinc-800 object-cover"
  />
  <div class="min-w-0 flex-1">
    <a
      href={game.url}
      target="_blank"
      rel="noopener noreferrer"
      class="block truncate text-sm font-semibold hover:text-amber-300"
    >
      {game.name}
    </a>
    <p class="truncate text-xs text-zinc-500">{game.publisher}</p>
  </div>
  <span
    class={[
      'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium',
      categoryStyle(game.category).badge
    ]}
  >
    {game.category}
  </span>
  <a
    href={game.url}
    target="_blank"
    rel="noopener noreferrer"
    class="shrink-0 rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
  >
    Play ↗
  </a>
</li>
