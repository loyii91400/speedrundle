<script>
  const steps = [
    {
      title: 'Configure Puzzles',
      description:
        'First time playing? Click on settings to load and configure your puzzles.',
      icon: '⚙️',
    },
    {
      title: 'Select Puzzles',
      description:
        'Choose the specific puzzles you want to play from the settings menu.',
      icon: '✅',
    },
    {
      title: 'Start Game',
      description:
        'Click the start button to begin your puzzle-solving adventure!',
      icon: '🎮',
    },
    {
      title: 'Split Puzzles',
      description:
        "If a puzzle doesn't auto-detect a split, use the split button to move to the next puzzle.",
      icon: '➗',
    },
  ];
</script>

<h2
  class="font-display mb-6 text-center text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400"
>
  How to Play
</h2>

<div class="space-y-4">
  {#each steps as step}
    <div
      class="flex items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <div class="mr-4 text-4xl opacity-70">{step.icon}</div>
      <div>
        <h3 class="font-display text-lg font-semibold text-amber-600 dark:text-amber-300">
          {step.title}
        </h3>
        <p class="text-zinc-600 dark:text-zinc-400">{step.description}</p>
      </div>
    </div>
  {/each}
</div>

<div class="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
  <p>Enjoy solving puzzles and have fun!</p>
</div>
<div>
  <div class="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
    <p>Want to support me?</p>
  </div>
  <div class="mt-2 flex justify-center">
    <a
      class="w-fit inline-block"
      href="https://ko-fi.com/G2G7I56LX"
      target="_blank"
    >
      <img
        height="36"
        style="border:0px;height:36px;"
        src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
        alt="Buy Me a Coffee at ko-fi.com"
      />
    </a>
  </div>
</div>
