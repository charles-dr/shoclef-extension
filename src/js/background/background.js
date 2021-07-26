var _tabs = [];
var _sites = [];
var appData;

const activity = {
  initializeSetting: async () => {
    return _MEMORY.loadSettings()
      .then(settings => {
        const max_tabs = settings.max_tabs || 3;
        settings = { ...settings, scraping: false, max_tabs };
        return _MEMORY.storeSettings(settings);
      });
  },
  openNewTab: (url = null) => {
    url = url || "https://google.com";
    return new Promise((resolve, reject) => {
      const tab = chrome.tabs.create({ url }, (tab => {
        console.log('[Tab created] callback', tab)
        _tabs.push(tab.id);
        resolve(tab.id);
      }));
    });
  },
  closeTabs: async (ids) => {
    return chrome.tabs.remove(ids);
  },
  selectCandidateProducts: (num) => {
    return _MEMORY.loadProducts()
      .then(products => products.filter(product => !product.scraping && !product.completed))
      .then((products) => products.slice(0, num));
  },
  fillEmptyTabs: () => {
    return _MEMORY.loadSettings()
      .then(settings => {
        if (!settings.scraping) throw new Error('Scraping is inactive!');
        if (_tabs.length >= settings.max_tabs) throw new Error('Already running max tabs!');
        return activity.selectCandidateProducts(settings.max_tabs - _tabs.length);
      })
      .then((products) => Promise.all(products.map(product => activity.openNewTab(product.url))))
      .catch(error => {
        console.log(`[Fill Empty Tabs] Error: ${error.message}`);
      });
  },
};


onBackgroundScriptLoaded();

// tab opened completely
chrome.webNavigation.onCompleted.addListener(async ({ url, tabId, processId, frameId, parentFrameId, timestamp }) => {
  console.log('[Tab Loaded]', url, tabId, _tabs);

  const parsedURL = new URL(url);
  const host = parsedURL.host.replace('www.', '');
  // const isTarget = _sites.some((site) => site.domain.includes(host));
  const sites = await _MEMORY.loadProfiles();
  const products = await _MEMORY.loadProducts();
  const [site] = sites.filter(st => st.domain.includes(host));
  const [product] = products.filter(prod => prod.url === url);

  // if this tab is opened by background script, then start scraping.
  if (_tabs.includes(tabId)) {
    chrome.tabs.sendMessage(tabId, { type: _ACTION.START_SCRAP, site, product });
    console.log('[Message] scrap~');
  }
});

// listen to closing tabs
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  _tabs.splice(_tabs.indexOf(tabId), 1);
  console.log('[Tab Closed]', tabId, removeInfo, _tabs);
});

chrome.extension.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {
  console.log('[Data] Requested', request)
  const { type } = request;
  // console.log('[message]', request, sender);
  if (type === "requestData") {
    sendResponse(appData);
  } else if (type === _ACTION.START_SCRAP) {
    return _MEMORY.loadSettings()
      .then(settings => {
        settings.scraping = true;
        return _MEMORY.storeSettings(settings);
      })
      .then(settings => activity.fillEmptyTabs())
      .then(() => sendResponse({ status: true }));
  }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  // const { newValue } = changes.data; //oldValue, 
  // console.log('[Data][Updated]', newValue);
  // appData = newValue;
});

async function onBackgroundScriptLoaded() {
  console.log('[Background] Loaded');
  await activity.initializeSetting();
  
  loadData();
  // setInterval(openNewTab, 5000);

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
