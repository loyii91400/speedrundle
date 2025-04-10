<script>
  import ThemePicker from './lib/component/ThemePicker.svelte';
  import Timer from './lib/component/Timer.svelte';
  import puzzlesStore from './lib/store/puzzles.svelte.js';
  import nextPuzzleStore from './lib/store/nextPuzzle.svelte';
  import { onMount } from 'svelte';
  import './lib/injectScript.svelte.js';
  import './lib/event.svelte.js';

  import Overlay from './lib/component/Overlay.svelte';
    import PuzzleSettings from './lib/component/PuzzleSettings.svelte';
  let isSettingsOverlayOpen = $state(false);

  let timerRef = $state(null);
  let currentPuzzle = $derived(puzzlesStore.currentPuzzle);
  let splits = $state([]);
  let puzzles = $derived(puzzlesStore.puzzles);
  let finishTime = $state(null);
  
  $effect(() => {
    if (nextPuzzleStore.nextPuzzle) {
      split();
    }
  });

  onMount(() => {
    puzzlesStore.load();
  });


  function openPuzzle() { 
    if (currentPuzzle >= puzzles.length) {
      stop()
      return;
    }
    try {
      chrome.tabs.create({
        url: puzzlesStore.puzzles[currentPuzzle].url,
        active: true
      })
    } catch (error) {
      window.open(puzzlesStore.puzzles[currentPuzzle].url, '_blank');
    }
  }

  function start() {
    reset();
    timerRef.start();
    openPuzzle();

  }
  
  function split() {
    splits = [...splits, timerRef.getFormattedTime()];
    nextPuzzleStore.nextPuzzle = false;
    openPuzzle();
  }
  
  function manualSplit() {
    puzzlesStore.incrementCurrentPuzzle();
    split();
  }

  function stop() {
    timerRef.stop();
    finishTime = timerRef.getFormattedTime();
  }

  function reset() {
    timerRef.reset();
    puzzlesStore.resetCurrentPuzzle()
    splits = [];
  }
</script>

<div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
  <div class="fixed top-4 right-2">
    <div class="flex flex-col gap-2">
      <ThemePicker />
      <button 
        onclick={() => isSettingsOverlayOpen = true} 
        class="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Toggle theme"
      >
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" class="text-gray-900 dark:text-white">
        <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
        <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M10.47 4.32c.602-1.306 2.458-1.306 3.06 0l.218.473a1.684 1.684 0 0 0 2.112.875l.49-.18c1.348-.498 2.66.814 2.162 2.163l-.18.489a1.684 1.684 0 0 0 .875 2.112l.474.218c1.305.602 1.305 2.458 0 3.06l-.474.218a1.684 1.684 0 0 0-.875 2.112l.18.49c.498 1.348-.814 2.66-2.163 2.162l-.489-.18a1.684 1.684 0 0 0-2.112.875l-.218.473c-.602 1.306-2.458 1.306-3.06 0l-.218-.473a1.684 1.684 0 0 0-2.112-.875l-.49.18c-1.348.498-2.66-.814-2.163-2.163l.181-.489a1.684 1.684 0 0 0-.875-2.112l-.474-.218c-1.305-.602-1.305-2.458 0-3.06l.474-.218a1.684 1.684 0 0 0 .875-2.112l-.18-.49c-.498-1.348.814-2.66 2.163-2.163l.489.181a1.684 1.684 0 0 0 2.112-.875l.218-.474Z"/>
      </svg>
      </button>
    </div>
  </div>
  <div>{currentPuzzle}</div>
  <div class="flex flex-col gap-4 p-16 h-screen items-center">
    <div class="text-4xl font-bold text-gray-800 dark:text-gray-100">Speedrundle</div>
    <Timer bind:this={timerRef} />
    {#if timerRef?.getIsRunning()}
      <button disabled={!timerRef?.getIsRunning()} onclick={manualSplit}>Split</button>
    {:else}
      <button onclick={start}>Start</button>
    {/if}
    <button onclick={reset}>Reset</button>
    <div class="flex flex-col gap-2">
      <!-- <pre>{JSON.stringify(puzzles, null, 2)}</pre> -->
      {#each puzzles as puzzle, index}
        <div class="flex items-center gap-2">
          <img width="32" height="32" src={puzzle.icon} alt={puzzle.name} />
          <a href={puzzle.url} target="_blank" rel="noopener noreferrer">{puzzle.name}</a>
          <div class="text-green-500">{splits[index] ?? ''}</div>
        </div>
      {/each}
    </div>
    {#if finishTime != null}
      <div>Share</div>
    {/if}
  </div>
</div>

<Overlay 
    isOpen={isSettingsOverlayOpen} 
    onClose={() => isSettingsOverlayOpen = false}
>
  <PuzzleSettings />
</Overlay>