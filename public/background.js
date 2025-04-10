import './serviceWorker/message.js';
import './serviceWorker/executeScript.js';

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));


// Alternatively, you can directly inject a script dynamically