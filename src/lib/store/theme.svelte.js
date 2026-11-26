import { storageGet, storageSet } from './storage.js';

let isDarkMode = $state(true);

export function getIsDarkMode() {
  return isDarkMode;
}

/**
 * @param {boolean} value
 */
export function setIsDarkMode(value) {
  isDarkMode = value;
}

export async function loadTheme() {
  const result = await storageGet(['theme']);
  if (result.theme !== undefined) {
    isDarkMode = result.theme === 'dark';
  } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    isDarkMode = true;
  }
  applyTheme();
}

export function toggleTheme() {
  isDarkMode = !isDarkMode;
  storageSet({ theme: isDarkMode ? 'dark' : 'light' });
  applyTheme();
}

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDarkMode);
}
