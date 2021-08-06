const AIRTABLE_API_KEY = 'key7O52RsgH6Nxxuv';
const EXTENSION_ID = 'hakobpmphaleegackblhmmigplnlbndp';
var _tabs = [];
var _sites = [];
var appData;
var Airtable = require("airtable");

const activity = {
  initializeSetting: async () => {
    return _MEMORY.loadSettings().then((settings) => {
      const iSettings = new AppConfig(settings);
      iSettings.maxTabs = iSettings.maxTabs || 5;
      iSettings.airtable.apiKey = iSettings.airtable.apiKey || AIRTABLE_API_KEY;
      iSettings.scraping = iSettings.scraping || false;
      console.log('[settings]', settings, iSettings);
      return _MEMORY.storeSettings(iSettings.toObject());
    });
  },
  openNewTab: (url = null) => {
    url = url || "https://google.com";
    return new Promise((resolve, reject) => {
      const tab = chrome.tabs.create({ url }, (tab) => {
        console.log("[Tab created] callback", tab);
        _tabs.push(tab.id);
        resolve(tab.id);
      });
    });
  },
  closeTabs: async (ids) => {
    return chrome.tabs.remove(ids);
  },
  getAllTabs: async () => {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.query({}, tabs => {
          resolve(tabs);
        });
      } catch (e) {
        reject(e);
      }
    });
  },
  getExtensionTabs: async () => {
    return activity.getAllTabs()
      .then(tabs => tabs.filter(tab => tab.url.includes(EXTENSION_ID)));
  },
  sendDataToTab: async (tabId, data) => {
    return chrome.tabs.sendMessage(tabId, data);
  },
  selectCandidateProducts: (num) => {
    return _MEMORY
      .loadProducts()
      .then((products) =>
        products.filter((product) => !product.scraping && !product.completed)
      )
      .then((products) => products.slice(0, num));
  },
  fillEmptyTabs: () => {
    return _MEMORY
      .loadSettings()
      .then((settings) => {
        const iSettings = new AppConfig(settings);
        // if (!settings.scraping) throw new Error("Scraping is inactive!");
        if (_tabs.length >= iSettings.maxTabs)
          throw new Error("Already running max tabs!");
        return activity.selectCandidateProducts(iSettings.maxTabs - _tabs.length);
      })
      .then((products) =>
        Promise.all(products.map((product) => activity.openNewTab(product.url)))
      )
      .catch((error) => {
        console.log(`[Fill Empty Tabs] Error: ${error.message}`);
      });
  },
  // UI
  onStartScrapRequest: (payload) => {
    /**
     * 1. load settings. update & save settings
     * 2. Airtable. total count, unscraped products. store to memory with scraped status 0.
     * 3. run tab manager. send message to UI
     */
    const { maxTabs, baseId } = payload;
    let _settings = {};
    
    return _MEMORY.loadSettings()
      .then(settings => {
        const iSettings = new AppConfig(settings);
        iSettings.maxTabs = maxTabs;
        iSettings.airtable.currentBase = baseId;
        return _MEMORY.storeSettings(iSettings.toObject());
      })
      .then(settings => {
        _settings = settings;
        const iSettings = new AppConfig(_settings);
        return Promise.all([
          activity.DB_loadProducts({
            apiKey: iSettings.airtable.apiKey,
            baseId: iSettings.airtable.currentBase,
            filter:"AND(NOT({URL to Competitor's Product} = '', {Scraped Completed from URL} = 0))",
          }),
          _MEMORY.loadProducts(),
        ]);
      })
      .then(([aProducts, sProducts]) => {
        console.log(`[Airtable] loaded ${aProducts.length} products!`);
        aProducts.forEach(aProduct => {
          // identify the product with url.
          const idx = sProducts.map(p => p.url.trim()).indexOf(aProduct.url);
          if (idx > -1) {
            sProducts[idx] = { ...sProducts[idx], ...aProduct };
          } else {
            sProducts.push(aProduct);
          }
        });
        return _MEMORY.storeProducts(sProducts);
      })
      .then(async sProducts => {
        const tabs = await activity.getExtensionTabs();

        console.log('[tabs]', tabs);
        tabs.forEach(tab => activity.sendDataToTab(tab.id, { status: 'TEST' }));
        return activity.fillEmptyTabs();
      })
      .catch(error => {
        console.log('[onStartScrapRequest]', error);
      });

  },

  // Airtable Operations.
  DB_totalCount: ({ apiKey, baseId, filter = ''}) => {
    var Airtable = require("airtable");
    var base = new Airtable({ apiKey }).base(baseId);
    return new Promise((resolve, reject) => {
      let total = 0;

      base("Products").select({
          fields: ["Product Title"],
          maxRecords: 50000,
          pageSize: 2,
          view: "All Product",
          // filterByFormula: "AND(NOT({Product Title} = ''), NOT({ahref to original product} = '', {Published} = 1))",
          filterByFormula: filter,
        })
        .eachPage(
          function page(records, fetchNextPage) {
            // records.forEach(record => {
            //   console.log('[Record]', record.get('Product Title'), record)
            // })
            total += records.length;
            fetchNextPage();
          },
          function done(err) {
            if (err) {
              console.error(err);
              reject(err);
            }
            resolve(total);
          }
        );
    });
  },
  DB_loadProducts: ({ apiKey, baseId, filter }) => {
    var base = new Airtable({ apiKey }).base(baseId);
    return new Promise((resolve, reject) => {
      let total = 0;
      const products = [];
      base("Products").select({
          // fields: ["Product Title"],
          maxRecords: 5000,
          pageSize: 100,
          view: "All Product",
          // filterByFormula: "AND(NOT({Product Title} = ''), NOT({ahref to original product} = '', {Published} = 1))",
          filterByFormula: filter,
        })
        .eachPage(
          function page(records, fetchNextPage) {
            records.forEach(record => {
              console.log('[Record]', record.id);
              const iProduct = new Product({
                title: record.get('Product Title'),
                url: record.get("URL to Competitor's Product").trim(),
                baseId,
                recordId: record.id,
              });
              products.push(iProduct.toObject());
            })
            fetchNextPage();
          },
          function done(err) {
            if (err) {
              console.error(err);
              reject(err);
            }
            resolve(products);
          }
        );
    });
  },
  DB_updateRecords: ({ apiKey, baseId, filter }) => {
    let base;
    base('Products').update([
      {
        "id": "recEnokgfENWLJ3Se",
        "fields": {
          "Product Title": "Fork Set !",
          "ahref to original product": "https://www.saksoff5th.com/product/mah-gender-neutral-pride-flag-canvas-sneakers-0400014188504.html?dwvar_0400014188504_color=WHITE_RAINBOW"
        }
      }
    ], function(err, records) {
      if (err) {
        console.log(err);
        return;
      }
      records.forEach(function(record) {
        console.log(record.get('Option1 Name'));
      });
    });
  },
};

onBackgroundScriptLoaded();

// tab opened completely
chrome.webNavigation.onCompleted.addListener(
  async ({ url, tabId, processId, frameId, parentFrameId, timestamp }) => {
    console.log("[Tab Loaded]", url, tabId, _tabs);

    const parsedURL = new URL(url);
    const host = parsedURL.host.replace("www.", "");
    // const isTarget = _sites.some((site) => site.domain.includes(host));
    const sites = await _MEMORY.loadProfiles();
    const products = await _MEMORY.loadProducts();
    const [site] = sites.filter((st) => st.domain.includes(host));
    const [product] = products.filter((prod) => prod.url === url);

    // if this tab is opened by background script, then start scraping.
    if (_tabs.includes(tabId)) {
      chrome.tabs.sendMessage(tabId, {
        type: _ACTION.START_SCRAP,
        site,
        product,
      });
      console.log("[Message] scrap~");
    }
  }
);

// listen to closing tabs
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  _tabs.splice(_tabs.indexOf(tabId), 1);
  console.log("[Tab Closed]", tabId, removeInfo, _tabs);
});

chrome.extension.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {
  console.log("[Data] Requested", request);
  const { type, ...payload } = request;
  // console.log('[message]', request, sender);
  if (type === "requestData") {
    sendResponse(appData);
  } else if (type === _ACTION.START_SCRAP) {
    activity.onStartScrapRequest(payload);
    // return _MEMORY
    //   .loadSettings()
    //   .then((settings) => {
    //     settings.scraping = true;
    //     settings.max_tabs = payload.max_tabs;
    //     return _MEMORY.storeSettings(settings);
    //   })
    //   .then((settings) => activity.fillEmptyTabs())
    //   .then(() => sendResponse({ status: true }));
  }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  // const { newValue } = changes.data; //oldValue,
  // console.log('[Data][Updated]', newValue);
  // appData = newValue;
});

async function onBackgroundScriptLoaded() {
  console.log("[Background] Loaded");
  await activity.initializeSetting();

  loadData();
  // setInterval(openNewTab, 5000);

  loadSiteProfiles().then((sites) => {
    _sites = sites;
  });

  // Airtable test
  var Airtable = require("airtable");
  var base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(
    "app3TPgrNQ8MAaMYI"
  );
  // base('Products').find('rectNtnIndBYEghXH', function(err, record) {
  //   if (err) { console.error(err); return; }
  //   console.log('Retrieved', record.id);
  // });

  // base('Products').select({
  //   // Selecting the first 3 records in All Product:
  //   fields: ['Product Title'],
  //   maxRecords: 5000,
  //   pageSize: 2,
  //   view: "All Product",
  //   // filterByFormula: "AND(NOT({Product Title} = ''), NOT({ahref to original product} = '', {Published} = 1))",
  //   filterByFormula: "AND(NOT({Product Title} = ''))",
  // }).eachPage(function page(records, fetchNextPage) {
  //     // This function (`page`) will get called for each page of records.
  //     console.log('[Page]');
  //     records.forEach(function(record) {
  //         console.log('Retrieved', record.get('Product Title'), record.get('Published'));
  //     });

  //     // To fetch the next page of records, call `fetchNextPage`.
  //     // If there are more records, `page` will get called again.
  //     // If there are no more records, `done` will get called.
  //     fetchNextPage();

  // }, function done(err) {
  //   console.log('[Done]');
  //     if (err) { console.error(err); return; }
  // });

  const total = await activity.DB_totalCount({
    apiKey: AIRTABLE_API_KEY,
    baseId: 'app3TPgrNQ8MAaMYI',
  });

  console.log("[Total]", total);
}

function loadData() {
  chrome.storage.local.get(["data"], function (store = {}) {
    const { data } = store;
    appData = data;
    console.log("[Cache][Data]", appData);
  });
}

function openNewTab(url = null) {
  url = url || "https://google.com";
  const tab = chrome.tabs.create({ url }, (tab) => {
    console.log("[Tab created] callback", tab);
    _tabs.push(tab.id);
  });
}

function loadSiteProfiles() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(
        ["websites", "websites1"],
        function (store = {}) {
          resolve(store.websites || []);
        }
      );
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
