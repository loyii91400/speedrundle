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
  <div class="text-gray-500">First time here? Click the settings icon.</div>
{/if}
<div
  class="flex flex-auto overflow-y-auto flex-col gap-2
	[&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:rounded-full
  [&::-webkit-scrollbar-track]:bg-gray-100
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-gray-300
  dark:[&::-webkit-scrollbar-track]:bg-neutral-700
  dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
>
  {#each puzzleStore.activePuzzles as puzzle, index}
    <div
      class="flex items-center gap-2 w-64 border border-gray-300 p-2 rounded"
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
          ? 'text-gray-400 cursor-move'
          : 'text-gray-300'}"
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
      <img width="32" height="32" src={puzzle.icon} alt={puzzle.name} />
      <button class="cursor-pointer" onclick={() => openPuzzle(puzzle.url)}
        >{puzzle.name}</button
      >
      {#if currentPuzzle === index && timerRef?.getIsRunning() && !timerRef?.getIsPaused()}
        {#if generalSettingsStore.isShowGiveUp}
          <button
            class="ml-auto p-2 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md cursor-pointer"
            onclick={giveUpCB}>Give up</button
          >
        {:else}
          <div class="ml-auto text-green-500">
            {timerRef.getFormattedTime()}
          </div>
        {/if}
      {:else}
        <div
          class="ml-auto {splits[index] === 'DNF'
            ? 'text-red-500'
            : 'text-green-500'}"
        >
          {splits[index] ?? ''}
        </div>
      {/if}
    </div>
  {/each}
</div>
