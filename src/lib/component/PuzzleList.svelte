<script>
  import puzzleStore from '../store/puzzles.svelte.js';

  export let splits = [];
  export let allowReorder = true;

  let draggedPuzzle = null;

  function handleDragStart(index) {
    if (!allowReorder) return;
    draggedPuzzle = index;
  }

  function handleDragOver(event) {
    if (!allowReorder) return;
    event.preventDefault();
  }

  function handleDrop(targetIndex) {
    if (!allowReorder || draggedPuzzle === null || draggedPuzzle === targetIndex) return;

    // Get the full puzzles array to modify
    const allPuzzles = puzzleStore.puzzles;
    
    // Find the actual puzzle objects
    const draggedPuzzleObj = puzzleStore.activePuzzles[draggedPuzzle];
    const targetPuzzleObj = puzzleStore.activePuzzles[targetIndex];

    // Swap the indices
    const tempIndex = draggedPuzzleObj.index;
    draggedPuzzleObj.index = targetPuzzleObj.index;
    targetPuzzleObj.index = tempIndex;

    // Update the puzzles in the store
    puzzleStore.puzzles = allPuzzles;

    draggedPuzzle = null;
  }
</script>

<div class="flex flex-col gap-2">
  {#each puzzleStore.activePuzzles as puzzle, index}
    <div 
      class="flex items-center gap-2 w-64 border border-gray-300 p-2 rounded"
      draggable={allowReorder}
      role="option"
      aria-selected={false}
      tabindex="0"
      on:dragstart={() => handleDragStart(index)}
      on:dragover={handleDragOver}
      on:drop={() => handleDrop(index)}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        class="w-5 h-5 {allowReorder ? 'text-gray-400 cursor-move' : 'text-gray-300'}" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <img width="32" height="32" src={puzzle.icon} alt={puzzle.name} />
      <a href={puzzle.url} target="_blank" rel="noopener noreferrer">{puzzle.name}</a>
      <div class="ml-auto {splits[index] === 'DNF' ? 'text-red-500' : 'text-green-500'}">{splits[index] ?? '' }</div>
    </div>
  {/each}
</div>
