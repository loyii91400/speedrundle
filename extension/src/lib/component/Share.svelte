<script>
  /**
   * @type {{ splits?: string[], finishTime?: string | null, puzzles?: import('../store/puzzles.svelte.js').Puzzle[] }}
   */
  let { splits = [], finishTime = null, puzzles = [] } = $props();

  let copied = $state(false);

  async function copyToClipboard() {
    const text = `OMG I JUST FINISHED SPEEDRUNDLE IN ${finishTime}\n\n${puzzles.map((puzzle, index) => `${puzzle.name}: ${splits[index] ?? ''}`).join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch (error) {
      console.error('Failed to copy score:', error);
    }
  }
</script>

<div class="flex flex-col gap-2 items-center">
  OMG I JUST FINISHED SPEEDRUNDLE IN {finishTime}
  <div class="flex flex-col gap-2">
    {#each puzzles as puzzle, index}
      <div class="flex gap-2">
        <div>{puzzle.name}</div>
        <div
          class="ml-auto font-mono tabular-nums {splits[index] === 'DNF'
            ? 'text-rose-500'
            : 'text-emerald-600 dark:text-emerald-400'}"
        >
          {splits[index] ?? ''}
        </div>
      </div>
    {/each}
  </div>
  <button
    onclick={copyToClipboard}
    class="w-40 h-10 cursor-pointer rounded-lg bg-amber-400 font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
    >{copied ? 'Copied!' : 'Copy to clipboard'}</button
  >
</div>
