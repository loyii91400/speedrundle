// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'complete') {
//     // console.log(tab.url)
    
//     // chrome.storage.local.get(['theme'], (result) => {
//     //   if (result.theme) {
//     //   console.log(result.theme)
//     //   } 
//     // });
//     chrome.scripting.executeScript({
//       target: { tabId: tabId },
//       files: ['content-script.js']
//     });
//   }
// });