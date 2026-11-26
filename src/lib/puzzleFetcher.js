import puzzlesStore from './store/puzzles.svelte';

export async function fetchPuzzles() {
	try {
		let error = null;

		// links.json is served from public/ in dev and bundled at the
		// extension root in production, so a relative fetch works in both.
		const response = await fetch('links.json');
		if (!response.ok) throw new Error('Failed to fetch links.json');
		const fetchedPuzzles = await response.json();

		// Create a new array to store all fetched puzzles
		let newPuzzlesArray = fetchedPuzzles.map((puzzle, i) => ({
			...puzzle,
			index: i,
		}));

		// Update active status based on current puzzles
		newPuzzlesArray = newPuzzlesArray.map((newPuzzle) => {
			// Find a matching puzzle in the current store
			const existingPuzzle = puzzlesStore.puzzles.find(
				(p) => p.name === newPuzzle.name && p.url === newPuzzle.url
			);

			// If a matching puzzle exists, preserve its active status
			return existingPuzzle
				? { ...newPuzzle, active: existingPuzzle.active }
				: { ...newPuzzle, active: true };
		});

		// Remove duplicates and set as new puzzles
		puzzlesStore.puzzles = newPuzzlesArray.filter(
			(puzzle, index, self) =>
				index ===
				self.findIndex((p) => p.name === puzzle.name && p.url === puzzle.url)
		);

		return { error };
	} catch (e) {
		return { error: e.message };
	}
}
