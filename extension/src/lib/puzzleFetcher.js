import puzzlesStore from './store/puzzles.svelte';

export async function fetchPuzzles() {
  try {
    let error = null;

    // links.json is served from public/ in dev and bundled at the
    // extension root in production, so a relative fetch works in both.
    const response = await fetch('links.json');
    if (!response.ok) throw new Error('Failed to fetch links.json');
    /** @type {import('./store/puzzles.svelte.js').Puzzle[]} */
    const fetchedPuzzles = await response.json();

    /** @param {Pick<import('./store/puzzles.svelte.js').Puzzle, 'name' | 'url'>} puzzle */
    const puzzleKey = (puzzle) => `${puzzle.name}\n${puzzle.url}`;
    /** @type {Map<string, import('./store/puzzles.svelte.js').Puzzle>} */
    const definitions = new Map();
    for (const puzzle of fetchedPuzzles) {
      if (!definitions.has(puzzleKey(puzzle))) {
        definitions.set(puzzleKey(puzzle), puzzle);
      }
    }

    // Refresh the bundled definitions without resetting the user's order or
    // active selections. New games are appended in catalogue order.
    const existingPuzzles = [...puzzlesStore.puzzles].sort(
      (a, b) => a.index - b.index
    );
    /** @type {import('./store/puzzles.svelte.js').Puzzle[]} */
    const mergedPuzzles = [];
    for (const existing of existingPuzzles) {
      const key = puzzleKey(existing);
      const definition = definitions.get(key);
      if (!definition) continue;
      mergedPuzzles.push({
        ...definition,
        active: existing.active,
        index: mergedPuzzles.length,
      });
      definitions.delete(key);
    }
    for (const definition of definitions.values()) {
      mergedPuzzles.push({
        ...definition,
        active: true,
        index: mergedPuzzles.length,
      });
    }

    puzzlesStore.puzzles = mergedPuzzles;
    return { error };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
