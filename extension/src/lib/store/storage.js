// Unified persistence layer.
//
// In dev (`vite`) the app runs as a plain web page, so state is kept in
// localStorage. In the built extension it lives in chrome.storage.local,
// which is shared with the content script.
export const isDebug = import.meta.env.DEV;

// Reads keys and returns { [key]: value }. Missing keys are absent from the
// result (callers should check `!== undefined` — a stored `false` or `0` is
// a real value, not "missing").
/**
 * @param {string[]} keys
 * @returns {Promise<Record<string, any>>}
 */
export async function storageGet(keys) {
  if (isDebug) {
    /** @type {Record<string, any>} */
    const out = {};
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          out[key] = JSON.parse(raw);
        } catch {
          // corrupted entry — treat as missing
        }
      }
    }
    return out;
  }
  return chrome.storage.local.get(keys);
}

// Writes a { key: value } map.
/**
 * @param {Record<string, any>} entries
 */
export async function storageSet(entries) {
  if (isDebug) {
    for (const [key, value] of Object.entries(entries)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
    return;
  }
  await chrome.storage.local.set(entries);
}
