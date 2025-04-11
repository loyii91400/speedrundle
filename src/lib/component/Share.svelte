<script>
  export let splits = [];
  export let finishTime = null;
  export let puzzles = [];
  
  function copyToClipboard() {
    const text = `OMG I JUST FINISHED SPEEDRUNDLE IN ${finishTime}\n\n${puzzles.map((puzzle, index) => `${puzzle.name}: ${splits[index] ?? ''}`).join('\n')}`;
    navigator.clipboard.writeText(text);
  }
</script>

<div class="flex flex-col gap-2 items-center">
  OMG I JUST FINISHED SPEEDRUNDLE IN {finishTime}
  <div class="flex flex-col gap-2">
    {#each puzzles as puzzle, index}
    <div class="flex gap-2">
      <div>{puzzle.name}</div>
      <div class="ml-auto {splits[index] === 'DNF' ? 'text-red-500' : 'text-green-500'}">{splits[index] ?? '' }</div>
    </div>
    {/each}
  </div>
  <button onclick={copyToClipboard} class="w-40 h-10 bg-gray-200 cursor-pointer dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md">Copy to clipboard</button>
</div>

