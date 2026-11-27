<script>
  import { REPO_URL, STORE_URL } from '$lib/games.js';

  const steps = [
    {
      title: 'Clone the repository',
      code: 'git clone https://github.com/loyii91400/speedrundle.git',
      note: null
    },
    {
      title: 'Install dependencies and build',
      code: 'cd speedrundle/extension\nnpm install\nnpm run build',
      note: 'The build outputs the unpacked Chrome extension into extension/dist/chrome/ and a ZIP archive at extension/dist/speedrundle-chrome.zip.'
    },
    {
      title: 'Load it in Chrome',
      code: null,
      note: 'Go to chrome://extensions, enable Developer mode, click "Load unpacked" and select the extension/dist/chrome/ directory.'
    },
    {
      title: 'Start your first run',
      code: null,
      note: 'Click the Speedrundle toolbar icon to open the side panel, then start a run and race your daily puzzles.'
    }
  ];
</script>

<svelte:head>
  <title>Install the extension — Speedrundle</title>
  <meta
    name="description"
    content="Install the Speedrundle Chrome extension from the Chrome Web Store and speedrun your daily puzzle games in one timed run."
  />
</svelte:head>

<section class="mx-auto max-w-2xl">
  <p class="mb-3 text-xs font-semibold tracking-widest text-amber-400 uppercase">Get started</p>
  <h1 class="font-display text-4xl font-bold tracking-tight">Install Speedrundle</h1>
  <p class="mt-4 text-zinc-400">
    Speedrundle is a free Chrome extension that strings your daily puzzles into one timed run.
    Install it from the Chrome Web Store to get started.
  </p>

  <a
    href={STORE_URL}
    target="_blank"
    rel="noopener noreferrer"
    class="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 text-lg font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
  >
    Add to Chrome ↗
  </a>
  <p class="mt-3 text-sm text-zinc-500">
    Once installed, click the Speedrundle toolbar icon to open the side panel and start your first
    run.
  </p>

  <div class="mt-14 border-t border-zinc-800 pt-8">
    <h2 class="font-display text-2xl font-bold tracking-tight">Or build from source</h2>
    <p class="mt-2 text-sm text-zinc-400">
      Speedrundle is open source — you can also build and load the extension yourself via
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        class="text-amber-300 underline decoration-amber-300/40 underline-offset-4 hover:text-amber-200"
      >
        GitHub ↗
      </a>.
    </p>

    <ol class="mt-8 space-y-8">
      {#each steps as step, i (step.title)}
        <li class="flex gap-4">
          <span
            class="font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-zinc-950"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <div class="min-w-0 flex-1">
            <h3 class="font-display text-lg font-semibold tracking-tight">{step.title}</h3>
            {#if step.code}
              <pre
                class="mt-3 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-200"><code
                  >{step.code}</code
                ></pre>
            {/if}
            {#if step.note}
              <p class="mt-2 text-sm leading-relaxed text-zinc-400">{step.note}</p>
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  </div>

  <div class="mt-12 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-6 text-center">
    <h2 class="font-display text-lg font-semibold tracking-tight">Ready to race?</h2>
    <p class="mt-1 text-sm text-zinc-400">Browse the catalogue and pick the games for your run.</p>
    <a
      href="/"
      class="mt-4 inline-block rounded-lg bg-amber-400 px-5 py-2.5 font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
    >
      Browse games
    </a>
  </div>
</section>
