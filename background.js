chrome.runtime.onStartup.addListener(() => {
  injectContentScripts();
});

chrome.runtime.onInstalled.addListener(() => {
  injectContentScripts();
});

function injectContentScripts() {
  chrome.tabs.query({ url: "https://www.youtube.com/*" }, (tabs) => {
    tabs.forEach(tab => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).catch(err => console.error('Error injecting script:', err));
    });
  });
}