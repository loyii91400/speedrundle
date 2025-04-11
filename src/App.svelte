<script>
  import ThemePicker from "./lib/component/ThemePicker.svelte";
  import Timer from "./lib/component/Timer.svelte";
  import puzzlesStore from "./lib/store/puzzles.svelte.js";
  import nextPuzzleStore from "./lib/store/nextPuzzle.svelte";
  import { onMount } from "svelte";
  import confetti from "canvas-confetti";
  import "./lib/event.svelte.js";

  import Overlay from "./lib/component/Overlay.svelte";
  import PuzzleSettings from "./lib/component/PuzzleSettings.svelte";
  import HowToPlay from "./lib/component/HowToPlay.svelte";
  import PuzzleList from "./lib/component/PuzzleList.svelte";
  import Share from "./lib/component/Share.svelte";
  import sourceUrlsStore from "./lib/store/sourceUrls.svelte";
  // import { fetchPuzzles } from './lib/puzzleFetcher';
  // import LinkOpener from './lib/component/LinkOpener.svelte';
  let isSettingsOverlayOpen = $state(false);
  let isHowToPlayOverlayOpen = $state(false);
  let isShareOverlayOpen = $state(false);

  let timerRef = $state(null);
  let currentPuzzle = $derived(puzzlesStore.currentPuzzle);
  let splits = $state([]);
  let puzzles = $derived(puzzlesStore.activePuzzles);
  let finishTime = $state(null);
  
  let puzzleTabId = $state(null);

  $effect(() => {
    if (nextPuzzleStore.nextPuzzle) {
      split();
    }
  });

  onMount(() => {
    puzzlesStore.load();
    sourceUrlsStore.load();
    try {
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (puzzleTabId === null) return;
        if (changeInfo.status === 'loading') {
          if (puzzleTabId === tabId) {
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content-script.js']
            });
          }
        }
      });
      
      chrome.tabs.onRemoved.addListener((tabId) => {
        if (puzzleTabId === null) return;
        if (puzzleTabId === tabId) {
          puzzleTabId === null
          puzzlesStore.incrementCurrentPuzzle()
          nextPuzzleStore.nextPuzzle = true;
          nextPuzzleStore.dnf = true
        }
          
      });
    } catch (error) {
      console.error(error);
    }
  });

  function openPuzzle() {
    if (currentPuzzle >= puzzles.length) {
      stop();
      return;
    }
    try {
      chrome.tabs.create(
        {
          url: puzzlesStore.activePuzzles[currentPuzzle].url,
          active: true,
        },
        (tab) => {
          puzzleTabId = tab.id;
          chrome.scripting.executescript({
            target: { tabid: tab.id },
            files: ["content-script.js"],
          });
        },
      );
    } catch (error) {
      console.log(error);
      window.open(puzzlesStore.activePuzzles[currentPuzzle].url, "_blank");
    }
  }

  function start() {
    reset();
    timerRef.start();
    openPuzzle();
  }

  function split() {
    if (nextPuzzleStore.dnf) {
      splits = [...splits, "DNF"];
      nextPuzzleStore.dnf = false;
    } else {
      splits = [...splits, timerRef.getFormattedTime()];
    }

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
    confetti();
  }

  function reset() {
    timerRef.reset();
    puzzlesStore.resetCurrentPuzzle();
    splits = [];
    finishTime = null;
  }
</script>

<div
  class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300"
>
  <div class="fixed top-4 right-2">
    <div class="flex flex-col gap-2">
      <ThemePicker />

      <button
        onclick={() => (isSettingsOverlayOpen = true)}
        class="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Toggle theme"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          class="text-gray-900 dark:text-white"
        >
          <path
            stroke="currentColor"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
          <path
            stroke="currentColor"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.47 4.32c.602-1.306 2.458-1.306 3.06 0l.218.473a1.684 1.684 0 0 0 2.112.875l.49-.18c1.348-.498 2.66.814 2.162 2.163l-.18.489a1.684 1.684 0 0 0 .875 2.112l.474.218c1.305.602 1.305 2.458 0 3.06l-.474.218a1.684 1.684 0 0 0-.875 2.112l.18.49c.498 1.348-.814 2.66-2.163 2.162l-.489-.18a1.684 1.684 0 0 0-2.112.875l-.218.473c-.602 1.306-2.458 1.306-3.06 0l-.218-.473a1.684 1.684 0 0 0-2.112-.875l-.49.18c-1.348.498-2.66-.814-2.163-2.163l.181-.489a1.684 1.684 0 0 0-.875-2.112l-.474-.218c-1.305-.602-1.305-2.458 0-3.06l.474-.218a1.684 1.684 0 0 0 .875-2.112l-.18-.49c-.498-1.348.814-2.66 2.163-2.163l.489.181a1.684 1.684 0 0 0 2.112-.875l.218-.474Z"
          />
        </svg>
      </button>

      <button
        onclick={() => (isHowToPlayOverlayOpen = true)}
        class="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="How to play"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="text-gray-900 dark:text-white"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M0.877075 7.49972C0.877075 3.84204 3.84222 0.876892 7.49991 0.876892C11.1576 0.876892 14.1227 3.84204 14.1227 7.49972C14.1227 11.1574 11.1576 14.1226 7.49991 14.1226C3.84222 14.1226 0.877075 11.1574 0.877075 7.49972ZM7.49991 1.82689C4.36689 1.82689 1.82708 4.36671 1.82708 7.49972C1.82708 10.6327 4.36689 13.1726 7.49991 13.1726C10.6329 13.1726 13.1727 10.6327 13.1727 7.49972C13.1727 4.36671 10.6329 1.82689 7.49991 1.82689ZM8.24993 10.5C8.24993 10.9142 7.91414 11.25 7.49993 11.25C7.08571 11.25 6.74993 10.9142 6.74993 10.5C6.74993 10.0858 7.08571 9.75 7.49993 9.75C7.91414 9.75 8.24993 10.0858 8.24993 10.5ZM6.05003 6.25C6.05003 5.57211 6.63511 4.925 7.50003 4.925C8.36496 4.925 8.95003 5.57211 8.95003 6.25C8.95003 6.74118 8.68002 6.99212 8.21447 7.27494C8.16251 7.30651 8.10258 7.34131 8.03847 7.37854L8.03841 7.37858C7.85521 7.48497 7.63788 7.61119 7.47449 7.73849C7.23214 7.92732 6.95003 8.23198 6.95003 8.7C6.95004 9.00376 7.19628 9.25 7.50004 9.25C7.8024 9.25 8.04778 9.00601 8.05002 8.70417L8.05056 8.7033C8.05924 8.6896 8.08493 8.65735 8.15058 8.6062C8.25207 8.52712 8.36508 8.46163 8.51567 8.37436L8.51571 8.37433C8.59422 8.32883 8.68296 8.27741 8.78559 8.21506C9.32004 7.89038 10.05 7.35382 10.05 6.25C10.05 4.92789 8.93511 3.825 7.50003 3.825C6.06496 3.825 4.95003 4.92789 4.95003 6.25C4.95003 6.55376 5.19628 6.8 5.50003 6.8C5.80379 6.8 6.05003 6.55376 6.05003 6.25Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  </div>
  <div class="flex flex-col gap-4 py-32 h-screen items-center">
    <div class="text-4xl font-bold text-gray-800 dark:text-gray-100">
      Speedrundle
    </div>
    <Timer bind:this={timerRef} />
    <div class="flex gap-4">
      {#if timerRef?.getIsRunning()}
        <button
          class="w-24 h-10 bg-gray-200 cursor-pointer dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md"
          onclick={manualSplit}>Split</button
        >
      {:else}
        <button
          class="w-24 h-10 bg-gray-200 cursor-pointer dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md"
          onclick={start}>Start</button
        >
      {/if}
      <button
        class="w-24 h-10 bg-gray-200 cursor-pointer dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md"
        onclick={reset}>Reset</button
      >
    </div>
    <PuzzleList {splits} allowReorder={!timerRef?.getIsRunning()} />
    {#if finishTime != null}
      <button class="cursor-pointer" onclick={() => (isShareOverlayOpen = true)}
        >Share your score</button
      >
    {/if}
  </div>
</div>

<Overlay
  isOpen={isSettingsOverlayOpen}
  onClose={() => (isSettingsOverlayOpen = false)}
>
  <PuzzleSettings />
</Overlay>

<Overlay
  isOpen={isHowToPlayOverlayOpen}
  onClose={() => (isHowToPlayOverlayOpen = false)}
>
  <HowToPlay />
</Overlay>

<Overlay
  isOpen={isShareOverlayOpen}
  onClose={() => (isShareOverlayOpen = false)}
>
  <Share {splits} {finishTime} {puzzles} />
</Overlay>

<!-- <LinkOpener /> -->
