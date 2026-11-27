<script>
  import { REPO_URL, STORE_URL } from '$lib/games.js';

  const setupSteps = [
    {
      title: 'Clone the repository',
      code: 'git clone https://github.com/loyii91400/speedrundle.git',
      note: null
    },
    {
      title: 'Install dependencies and build',
      code: 'cd speedrundle/extension\nnpm install\nnpm run build',
      note: 'The build creates unpacked Chrome and Firefox extensions in extension/dist/chrome/ and extension/dist/firefox/, plus a ZIP archive for each browser.'
    }
  ];

  const browserGuides = [
    {
      id: 'chrome',
      name: 'Chrome',
      description: null,
      steps: [
        {
          title: 'Load it in Chrome',
          note: 'Go to chrome://extensions, enable Developer mode, click "Load unpacked" and select the extension/dist/chrome/ directory.'
        },
        {
          title: 'Start your first run',
          note: 'Click the Speedrundle toolbar icon to open the side panel, then start a run and race your daily puzzles.'
        }
      ]
    },
    {
      id: 'firefox',
      name: 'Firefox',
      description:
        'Firefox 128 or later is required. This installs Speedrundle as a temporary add-on, which is removed when Firefox restarts.',
      steps: [
        {
          title: 'Load it temporarily in Firefox',
          note: 'Go to about:debugging#/runtime/this-firefox, click "Load Temporary Add-on" and select the extension/dist/firefox/manifest.json file.'
        },
        {
          title: 'Start your first run',
          note: 'Click the Speedrundle toolbar icon to open the sidebar, then start a run and race your daily puzzles.'
        }
      ]
    }
  ];
</script>

<svelte:head>
  <title>Install the extension — Speedrundle</title>
  <meta
    name="description"
    content="Install Speedrundle for Chrome or Firefox and speedrun your daily puzzle games in one timed run."
  />
</svelte:head>

<section class="mx-auto max-w-2xl">
  <p class="mb-3 text-xs font-semibold tracking-widest text-amber-400 uppercase">Get started</p>
  <h1 class="font-display text-4xl font-bold tracking-tight">Install Speedrundle</h1>
  <p class="mt-4 text-zinc-400">
    Speedrundle is a free browser extension that strings your daily puzzles into one timed run.
    Install it from the Chrome Web Store, or build it from source for Chrome or Firefox.
  </p>

  <div class="mt-6 flex flex-wrap gap-3">
    <a
      href={STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 text-lg font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
    >
      Add to Chrome ↗
    </a>
    <a
      href="#firefox"
      class="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-6 py-3 text-lg font-semibold text-zinc-200 transition-colors hover:border-zinc-500"
    >
      Firefox instructions ↓
    </a>
  </div>
  <p class="mt-3 text-sm text-zinc-500">
    Once installed from the Chrome Web Store, click the Speedrundle toolbar icon to open the side
    panel and start your first run.
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
      {#each setupSteps as step, i (step.title)}
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

    <div class="mt-12 space-y-12">
      {#each browserGuides as guide (guide.id)}
        <section id={guide.id} class="scroll-mt-8">
          <h3 class="font-display text-xl font-bold tracking-tight">Load in {guide.name}</h3>
          {#if guide.description}
            <p class="mt-2 text-sm leading-relaxed text-zinc-400">{guide.description}</p>
          {/if}
          <ol class="mt-6 space-y-8">
            {#each guide.steps as step, i (step.title)}
              <li class="flex gap-4">
                <span
                  class="font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-zinc-950"
                  aria-hidden="true"
                >
                  {i + 3}
                </span>
                <div class="min-w-0 flex-1">
                  <h4 class="font-display text-lg font-semibold tracking-tight">{step.title}</h4>
                  <p class="mt-2 text-sm leading-relaxed text-zinc-400">{step.note}</p>
                </div>
              </li>
            {/each}
          </ol>
        </section>
      {/each}
    </div>
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
