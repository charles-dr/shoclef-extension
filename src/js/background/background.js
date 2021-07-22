var _tabs = [];
var _sites = [];
var appData;

onBackgroundScriptLoaded();

chrome.webNavigation.onCompleted.addListener(function({ url, tabId, processId, frameId, parentFrameId, timestamp }) {
  console.log('[Tab Loaded]', url, tabId, _tabs);

  const parsedURL = new URL(url);
  const host = parsedURL.host.replace('www.', '');
  const isTarget = _sites.some((site) => site.domain.includes(host));
  const [site] = _sites.filter(st => st.domain.includes(host));

  // if this tab is opened by background script, then start scraping.
  if (_tabs.includes(tabId)) {
    chrome.tabs.sendMessage(tabId, { type: 'DO_SCRAPING', site });
    console.log('[Message] scrap~');
  }
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

function onBackgroundScriptLoaded() {
  console.log('[Background] Loaded');
  loadData();

  // setInterval(openNewTab, 5000);
  openNewTab();

  loadSiteProfiles().then((sites) => {
    _sites = sites;
  });
}

function loadData() {
  chrome.storage.local.get(['data'], function (store = {}) {
    const { data } = store;
    appData = data;
    console.log('[Cache][Data]', appData);
  });
}

function openNewTab(url = null) {
  url = url || "https://google.com";
  const tab = chrome.tabs.create({ url }, (tab => {
    console.log('[Tab created] callback', tab)
    _tabs.push(tab.id);
  }));
}

function loadSiteProfiles() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(["websites", "websites1"], function (store = {}) {
        resolve(store.websites || []);      
      });
    } catch (e) {
      reject(e);
    }
  });
}

function storeSiteProfiles(profiles) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set({ websites: profiles });
      resolve(profiles);
    } catch (e) {
      reject(e);
    }
  });
}
