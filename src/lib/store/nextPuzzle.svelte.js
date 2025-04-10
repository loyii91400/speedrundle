function createNextPuzzle() {
    let nextPuzzle = $state(false);
    
    return {
        get nextPuzzle() {
            return nextPuzzle;
        },
        set nextPuzzle(value) {
            nextPuzzle = value;
        }
    }
}

const nextPuzzle = createNextPuzzle();
export default nextPuzzle;