function createNextPuzzle() {
  let nextPuzzle = $state(false);
  let dnf = $state(false);

  return {
    get nextPuzzle() {
      return nextPuzzle;
    },
    set nextPuzzle(value) {
      nextPuzzle = value;
    },
    get dnf() {
      return dnf;
    },
    set dnf(value) {
      dnf = value;
    },
  };
}

const nextPuzzle = createNextPuzzle();
export default nextPuzzle;
