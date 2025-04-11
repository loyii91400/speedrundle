// @class sourceUrl
// @field urls string - The urls to the sources of the puzzle

// Configuration flag to determine storage method
export const isDebug = import.meta.env.DEV; // Set this based on your debug environment

function createSourceUrls() {
  let sourceUrls = $state('');

  return {
    get sourceUrls() {
      return sourceUrls;
    },
    set sourceUrls(value) {
      sourceUrls = value;
      this.save();
    },
    load: () => {
      if (isDebug) {
        const savedSourceUrls = localStorage.getItem('sourceUrls');
        if (savedSourceUrls) {
          sourceUrls = JSON.parse(savedSourceUrls);
        } else {
          sourceUrls = 'https://raw.githubusercontent.com/loyii91400/wordleTest/refs/heads/main/links.json';
        }
     } else {
        chrome.storage.local.get(['sourceUrls'], (result) => {
          if (result.sourceUrls) {
            sourceUrls = result.sourceUrls;
          } else {
            sourceUrls = 'https://raw.githubusercontent.com/loyii91400/wordleTest/refs/heads/main/links.json';
          }
        });
      }
    },
    save: () => {
      if (isDebug) {
        localStorage.setItem('sourceUrls', JSON.stringify(sourceUrls));
      } else {
        chrome.storage.local.set({ sourceUrls: sourceUrls });
      }
    }
  };
}

const sourceUrlsStore = createSourceUrls();
export default sourceUrlsStore