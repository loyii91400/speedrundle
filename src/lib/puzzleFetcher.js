import puzzlesStore from './store/puzzles.svelte';

export async function fetchPuzzles(
	urls = 'https://raw.githubusercontent.com/loyii91400/wordleTest/refs/heads/main/links.json'
) {
	try {
		let error = null;
		const urlList = urls.split('\n').filter((url) => url.trim());

		// Create a new array to store all fetched puzzles
		let newPuzzlesArray = [];

		// Fetch puzzles from all URLs
		for (const url of urlList) {
			try {
				const response = await fetch(url.trim());
				if (!response.ok) throw new Error(`Failed to fetch from ${url}`);
				const fetchedPuzzles = await response.json();

				// Add sourceUrl to each puzzle
				const puzzlesWithSource = fetchedPuzzles.map((puzzle, i) => ({
					...puzzle,
					index: i,
					sourceUrl: url.trim(),
				}));

				newPuzzlesArray.push(...puzzlesWithSource);
			} catch (e) {
				error = (error ? error + '\n' : '') + `Error fetching ${url}`;
			}
		}

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
