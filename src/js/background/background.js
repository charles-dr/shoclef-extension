let _tabs = {};
var appData;
console.log('[Background] Loaded');

loadData();

// setInterval(openNewTab, 5000);
openNewTab();

chrome.webNavigation.onCompleted.addListener(function({ url, tabId, processId, frameId, parentFrameId, timestamp }) {
  console.log('[Tab Loaded]', url);
  // chrome.tabs.executeScript(tabId, {
  //   code: `
  //     alerk('Hey');
  //   `,
  // });
  chrome.tabs.sendMessage(tabId, { type: 'DO_SCRAPING' });
  console.log('[Message] scrap~');
});

chrome.extension.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {
  console.log('[Data] Requested')
  const { type } = request;
  // console.log('[message]', request, sender);
  if (type === "requestData") {
    sendResponse(appData);
  }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  const { oldValue, newValue } = changes.data;
  console.log('[Data][Updated]', newValue);
  appData = newValue;
});

function loadData() {
  chrome.storage.local.get(['data'], function (store = {}) {
    const { data } = store;
    appData = data;
    console.log('[Cache][Data]', appData);
  });
}

function openNewTab(url = null) {
  url = url || "https://google.com";
  const tab = chrome.tabs.create({ url });
  console.log('[Tab] created', tab);
}