<script>
  import puzzleStore from '../store/puzzles.svelte.js';
  import generalSettingsStore from '../store/generalSettings.svelte';

  /**
   * @type {{ currentPuzzle: number, timerRef: { getIsRunning: () => boolean, getIsPaused: () => boolean, getFormattedTime: () => string } | null, allowReorder?: boolean, splits?: string[], giveUpCB: () => void }}
   */
  let {
    currentPuzzle,
    timerRef,
    allowReorder = true,
    splits = [],
    giveUpCB,
  } = $props();

  /** @type {number | null} */
  let draggedPuzzle = null;

  /**
   * @param {number} index
   */
  function handleDragStart(index) {
    if (!allowReorder) return;
    draggedPuzzle = index;
  }

  /**
   * @param {DragEvent} event
   */
  function handleDragOver(event) {
    if (!allowReorder) return;
    event.preventDefault();
  }

  /**
   * @param {number} targetIndex
   */
  function handleDrop(targetIndex) {
    if (
      !allowReorder ||
      draggedPuzzle === null ||
      draggedPuzzle === targetIndex
    )
      return;

    // Get the full puzzles array to modify
    const allPuzzles = puzzleStore.puzzles;

    // Find the actual puzzle objects
    const draggedPuzzleObj = puzzleStore.activePuzzles[draggedPuzzle];
    const targetPuzzleObj = puzzleStore.activePuzzles[targetIndex];
    if (!draggedPuzzleObj || !targetPuzzleObj) return;

    // Swap the indices
    const tempIndex = draggedPuzzleObj.index;
    draggedPuzzleObj.index = targetPuzzleObj.index;
    targetPuzzleObj.index = tempIndex;

    // Update the puzzles in the store
    puzzleStore.puzzles = allPuzzles;

    draggedPuzzle = null;
  }

  /**
   * @param {string} url
   */
  function openPuzzle(url) {
    try {
      chrome.tabs.create({ url, active: true }, () => {
        if (chrome.runtime.lastError) {
          console.error('Failed to open puzzle tab:', chrome.runtime.lastError);
          window.open(url, '_blank');
        }
      });
    } catch (error) {
      window.open(url, '_blank');
    }
  }
</script>

{#if puzzleStore.activePuzzles.length === 0}
  <div class="text-zinc-500 dark:text-zinc-400">First time here? Click the settings icon.</div>
{/if}
<div
  class="flex flex-auto overflow-y-auto flex-col gap-2
	[&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:rounded-full
  [&::-webkit-scrollbar-track]:bg-zinc-100
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-zinc-300
  dark:[&::-webkit-scrollbar-track]:bg-zinc-800
  dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600"
>
  {#each puzzleStore.activePuzzles as puzzle, index}
    {@const isActive = currentPuzzle === index && timerRef?.getIsRunning()}
    <div
      class={[
        'flex w-64 items-center gap-2 rounded-xl border p-2 transition-colors',
        isActive
          ? 'border-amber-400/70 bg-amber-400/5'
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60'
      ]}
      draggable={allowReorder}
      role="option"
      aria-selected={false}
      tabindex="0"
      ondragstart={() => handleDragStart(index)}
      ondragover={handleDragOver}
      ondrop={() => handleDrop(index)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-5 h-5 {allowReorder
          ? 'text-zinc-400 cursor-move'
          : 'text-zinc-300 dark:text-zinc-600'}"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
      <img width="32" height="32" src={puzzle.icon} alt={puzzle.name} class="rounded-lg" />
      <button
        class="cursor-pointer font-medium hover:text-amber-600 dark:hover:text-amber-300"
        onclick={() => openPuzzle(puzzle.url)}>{puzzle.name}</button
      >
      {#if currentPuzzle === index && timerRef?.getIsRunning() && !timerRef?.getIsPaused()}
        {#if generalSettingsStore.isShowGiveUp}
          <button
            class="ml-auto cursor-pointer rounded-md bg-zinc-200 px-2 py-1 text-sm text-zinc-800 transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            onclick={giveUpCB}>Give up</button
          >
        {:else}
          <div class="ml-auto font-mono tabular-nums text-green-500">
            {timerRef.getFormattedTime()}
          </div>
        {/if}
      {:else}
        <div
          class="ml-auto font-mono tabular-nums {splits[index] === 'DNF'
            ? 'text-rose-500'
            : 'text-emerald-600 dark:text-emerald-400'}"
        >
          {splits[index] ?? ''}
        </div>
      {/if}
    </div>
  {/each}
</div>
