<script>
  import { onMount } from 'svelte';
  import { getIsDarkMode, setIsDarkMode } from '../store/theme.svelte.js';

  let isDarkMode = $derived(getIsDarkMode());
  const isDebug = import.meta.env.DEV;

  export function toggleTheme() {
    setIsDarkMode(!isDarkMode);
    updateTheme();
  }

  export function updateTheme() {
    if (isDebug) {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    } else {
      chrome.storage.local.set({ theme: isDarkMode ? 'dark' : 'light' });
    }

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  onMount(() => {
    if (isDebug) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
        // isDarkMode = savedTheme === 'dark';
        updateTheme();
      } else if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        setIsDarkMode(true);
        // isDarkMode = true;
        updateTheme();
      }
    } else {
      chrome.storage.local.get(['theme'], (result) => {
        if (result.theme) {
          // isDarkMode = result.theme === 'dark';
          setIsDarkMode(result.theme === 'dark');
          updateTheme();
        } else if (
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
        ) {
          // isDarkMode = true;
          setIsDarkMode(true);
          updateTheme();
        }
      });
    }
  });
</script>

<button
  onclick={toggleTheme}
  class="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
  aria-label="Toggle theme"
>
  {#if isDarkMode}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-6 w-6 text-yellow-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m3.343-5.657L5.636 5.636m12.728 12.728L18.364 18.364M12 7a5 5 0 110 10 5 5 0 010-10z"
      />
    </svg>
  {:else}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-6 w-6 text-gray-800"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  {/if}
</button>
