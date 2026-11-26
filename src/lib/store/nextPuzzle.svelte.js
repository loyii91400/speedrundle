function createNextPuzzle() {
  let nextPuzzle = $state(false);
  let dnf = $state(false);

  return {
    get nextPuzzle() {
      return nextPuzzle;
    },
    /**
     * @param {boolean} value
     */
    set nextPuzzle(value) {
      nextPuzzle = value;
    },
    get dnf() {
      return dnf;
    },
    /**
     * @param {boolean} value
     */
    set dnf(value) {
      dnf = value;
    },
  };
}

const nextPuzzle = createNextPuzzle();
export default nextPuzzle;
