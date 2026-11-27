<script>
  import { base } from '$app/paths';
  import '../app.css';
  import { REPO_URL } from '$lib/games.js';

  let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
  <header class="border-b border-zinc-800/80">
    <nav class="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
      <a
        href="{base}/"
        class="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight"
      >
        <span
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-base text-zinc-950"
          aria-hidden="true">⏱</span
        >
        Daily Games Speedrun
      </a>
      <div class="flex items-center gap-1 text-sm font-medium text-zinc-400">
        <a href="{base}/" class="rounded-md px-3 py-2 transition-colors hover:text-zinc-100"
          >Games</a
        >
        <a href="{base}/install" class="rounded-md px-3 py-2 transition-colors hover:text-zinc-100">
          Install
        </a>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-md px-3 py-2 transition-colors hover:text-zinc-100"
        >
          GitHub ↗
        </a>
      </div>
    </nav>
  </header>

  <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
    {@render children()}
  </main>

  <footer class="border-t border-zinc-800/80">
    <div
      class="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:px-6"
    >
      <div class="text-center sm:text-left">
        <p>Daily Games Speedrun — speedrun your daily puzzles.</p>
        <p class="mt-1 text-xs">
          Found a bug or have an issue?
          <a
            href={`${REPO_URL}/issues/new`}
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-zinc-400 transition-colors hover:text-zinc-200"
            >Report it on GitHub</a
          >.
          <br />
          Have a suggestion?
          <a
            href={`${REPO_URL}/issues/new?title=Suggestion%3A%20`}
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-zinc-400 transition-colors hover:text-zinc-200"
            >Share it on GitHub</a
          >.
        </p>
      </div>
      <div class="flex items-center gap-4">
        <a href="{base}/install" class="transition-colors hover:text-zinc-300"
          >Install the extension</a
        >
        <a
          href={REPO_URL}
          class="transition-colors hover:text-zinc-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </a>
      </div>
    </div>
  </footer>
</div>
