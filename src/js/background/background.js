const AIRTABLE_API_KEY = 'key7O52RsgH6Nxxuv';
const EXTENSION_ID = 'hakobpmphaleegackblhmmigplnlbndp';

var tabManager = new TabStatusManager();

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
      return _MEMORY.storeSettings(iSettings.toObject());
    });
  },
  openNewTab: (url = null) => {
    url = url || "https://google.com";
    tabManager.addTab({ url });
    return new Promise((resolve, reject) => {
      const tab = chrome.tabs.create({ url, active: false }, (tab) => {
        tabManager.tabOpened(url, tab.id);
        resolve(tab.id);
      });
    });
  },
  closeTabs: async (ids) => {
    // return chrome.tabs.remove(ids);
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.remove(ids, () => {
          console.log('[closeTab] closed ', ids);
          resolve(true);
        });
      } catch (e) {
        reject(e);
      }
    });
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
  messageToExtensionPage: async (data = {}) => {
    const tabs = await activity.getExtensionTabs();
    tabs.forEach(tab => activity.sendDataToTab(tab.id, data));
  },
  selectCandidateProducts: (num) => {
    return _MEMORY
      .loadProducts()
      .then((products) =>
        products
          .filter((product) => !product.scraping && !product.completed)
          .filter(product => !tabManager.getTabOriginURLs().includes(product.url))
          .filter(product => _HOSTS_EMBEDDED.some(host => product.url.includes(host)))
      )
      // .then((products) => products.slice(0, num));
      .then(products => {
        const indexArray = Array.from(Array(10).keys());
        const shuffled = indexArray.sort(() => 0.5 - Math.random());
        const selectedIndex = shuffled.slice(0, num);
        return products.filter((product, i) => selectedIndex.includes(i));
      });
  },
  fillEmptyTabs: (init = false) => {
    console.log('[Activity][FillEmptyTabs]');
    return _MEMORY
      .loadSettings()
      // .then(settings => {
      //   const iSettings = new AppConfig(settings);
      //   iSettings.scraping = true;
      //   return _MEMORY.storeSettings(iSettings.toObject());
      // })
      .then(async (settings) => {
        const iSettings = new AppConfig(settings);
        if (!settings.scraping) {
          // await activity.messageToExtensionPage({
          //   type: _ACTION.SYSTEM_MESSAGE,
          //   status: false,
          //   title: 'Error',
          //   message: 'Scraping is inactive now!',
          // });
          throw new Error("Scraping is inactive!");
        }

        if (tabManager.tabs.length >= iSettings.maxTabs)
          throw new Error("Already running max tabs!");
        return activity.selectCandidateProducts(iSettings.maxTabs - tabManager.tabs.length);
      })
      .then(async (products) => {
        console.log(`[fillEmptyTabs] will open ${products.length} tabs!`);
        if (products.length === 0) {
          await activity.messageToExtensionPage({
            type: _ACTION.SYSTEM_MESSAGE,
            status: true,
            title: 'Scraping',
            message: 'All products are scraped!',
          });
          // update setting : { scraping: false }
          const settings = await _MEMORY.loadSettings();
          settings.scraping = false;
          await _MEMORY.storeSettings(settings);
        } else {
          if (init) {
            await activity.messageToExtensionPage({
              type: _ACTION.SYSTEM_MESSAGE,
              status: true,
              title: 'Success',
              message: 'Scraping started!',
            });
          }
        }
        await activity.messageToExtensionPage({
          type: _ACTION.SETTING_UPDATED,
          status: true,
          data: await _MEMORY.loadSettings(),
        });
        return Promise.all(products.map((product) => activity.openNewTab(product.url)))
      })
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
        iSettings.scraping = true;
        return _MEMORY.storeSettings(iSettings.toObject());
      })
      .then(settings => {
        _settings = settings;
        const iSettings = new AppConfig(_settings);
        return Promise.all([
          activity.DB_loadProducts({
            apiKey: iSettings.airtable.apiKey,
            baseId: iSettings.airtable.currentBase,
            filter: "AND(NOT({URL to Competitor's Product} = ''), {Scraped Completed from URL} = 0)",
          }),
          _MEMORY.loadProducts(),
        ]);
      })
      .then(([aProducts, sProducts]) => {
        console.log(`[Airtable] loaded ${aProducts.length} products!`);
        aProducts.forEach(aProduct => {
          // identify the product with url.
          const idx = sProducts.map(p => p.url.trim()).indexOf(aProduct.url);
          if (idx > -1 && sProducts[idx]['completed']) return true;
          if (idx > -1) {
            sProducts[idx] = { ...sProducts[idx], ...aProduct };
          } else {
            sProducts.push(aProduct);
          }
        });
        return _MEMORY.storeProducts(sProducts);
      })
      .then(async sProducts => {
        // select & open pages.
        return activity.fillEmptyTabs(true);
      })
      .catch(error => {
        console.log('[onStartScrapRequest]', error);
      });

  },
  onScrapCompleted: async (product, tabId) => {
    const [tab] = tabManager.tabs.filter(t => t.id === tabId);
    if (!tab) {
      console.log('[onScrapingCompleted] The target tab is not registered in the manager!');
      return false;
    }
    // if (!tab) throw new Error('The target tab is not registered in the manager!');
    return _MEMORY.loadProducts()
      .then(sProducts => {
        // const idx = sProducts.map(p => p.url).indexOf(product.url);
        const idx = sProducts.map(p => p.url).indexOf(tab.originURL);
        if (idx > -1) {
          const updateKeys = ['title', 'description', 'price', 'oldPrice', 'currency', 'images', 'brand', 'category', 'colors', 'sizes', 'variants'];
          updateKeys.forEach(key => {
            sProducts[idx][key] = product[key];
          });
          sProducts[idx]['completed'] = true;
          sProducts[idx]['scraping'] = false;
          sProducts[idx].updatedAt = Date.now();
          console.log('[Update target product with scraping result.]', sProducts[idx].completed, sProducts[idx]);
        }
        return _MEMORY.storeProducts(sProducts);
      });
  },

  markProductAsScrapingByURL: (url, scraping = true) => {
    return _MEMORY.loadProducts()
      .then(sProducts => {
        const idx = sProducts.map(p => p.url).indexOf(url);
        if (idx > -1) {
          sProducts[idx].scraping = scraping;
        }
        return _MEMORY.storeProducts(sProducts);
      });
  },

  uploadProducts: async (products) => {
    return _MEMORY.loadSettings()
      .then(async settings => {
        const iSettings = new AppConfig(settings);
        const uProducts = products.map(product => {
          const iProduct = new Product(product); 
          return {
            id: iProduct.recordId,
            fields: {
              'Product Title': iProduct.title,
              'Body HTML': iProduct.description,
              'Brand': iProduct.brand,
              'Category': iProduct.category.replace(/::/g, ','),
              '∞ Add images from URLs': iProduct.images.join(','),
              'Price': iProduct.price.toString(),
              'Currency': iProduct.currency,
              'Colors': iProduct.colors.join(','),
              'Sizes': iProduct.sizes.join(','),
              'Scraped Completed from URL': true,
            },
          };
        });
        console.log('[Upload List]', uProducts);
        const Airtable = require("airtable");
        const base = new Airtable({ apiKey: iSettings.airtable.apiKey }).base(iSettings.airtable.currentBase);
        let records = [];
        const nIter = Math.ceil(uProducts.length / 10);
        for (let i = 0; i < nIter; i++) {
          records = records.concat(await activity.DB_updateRecords(base, uProducts.slice(i * 10, (i + 1) * 10)));
          console.log(`[Uploading] ${records.length}/${uProducts.length}`)
        }
        console.log('[Upload] Done');
        return records;
        // return activity.DB_updateRecords(base, uProducts);
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
          pageSize: 100,
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
  DB_updateRecords: async (base, list) => {
    return new Promise((resolve, reject) => {
      try {
        base('Products').update(list, function(err, records) {
          if (err) {
            console.log(err);
            reject(err);
          }
          resolve(records);
        });
      } catch (error) {
        console.log('[UploadProduct] Error: ', error);
        reject(error);
      }
    });
  },
};

onBackgroundScriptLoaded();

// tab opened completely
chrome.webNavigation.onCompleted.addListener(
  async ({ url, tabId, processId, frameId, parentFrameId, timestamp }) => {
    if (url === 'about:blank') return;
    const parsedURL = new URL(url);
    const host = parsedURL.host.replace("www.", "");
    const tabStatus = tabManager.getTabById(tabId);

    // if this tab is opened by background script, then start scraping.
    if (tabStatus && tabStatus.url === url && tabStatus.opened && !tabStatus.scraping) {
      // const isTarget = _sites.some((site) => site.domain.includes(host));
      const sites = await _MEMORY.loadProfiles();
      const products = await _MEMORY.loadProducts();
      const [site] = sites.filter((st) => st.domain.includes(host));
      const [product] = products.filter((prod) => prod.url === tabStatus.originURL);
      tabManager.startedTabScraping(url);
      chrome.tabs.sendMessage(tabId, {
        type: _ACTION.START_SCRAP,
        site: site || {},
        product,
      });
      await activity.markProductAsScrapingByURL(url);
      console.log("[Message] scrap~", tabId, url);
    }
  }
);

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // console.log('updated tab', tabId, tab, changeInfo);
  if (changeInfo.status === 'complete') {

  } else if (changeInfo.url) {
    tabManager.tabURLUpdated(tabId, changeInfo.url);
  }
});

// listen to closing tabs
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (tabManager.getTabIds().includes(tabId)) {
    tabManager.deleteTabById(tabId);
    return activity.fillEmptyTabs();
  }
});

// Listen to the messages from content scripts and extension pages.
chrome.extension.onMessage.addListener(function ( request, sender, sendResponse ) {
  console.log("[Data] Requested", request);
  const { type, ...payload } = request;
  const { tab: { id, url } } = sender;
  // console.log('[message]', request);
  console.log('[Sender]', id, url);

  if (type === "requestData") {
    sendResponse(appData);
  } else if (type === _ACTION.START_SCRAP) {
    activity.onStartScrapRequest(payload);
  } else if (type === _ACTION.SCRAP_FINISHED) {
    return activity.onScrapCompleted(payload.product, id)
      .then((sProducts) => {
        // console.log('[After Marked completed]', sProducts);
        return activity.closeTabs([id]);
      });
  } else if (type === _ACTION.UPLOAD_PRODUCT) {
    return _MEMORY.loadProducts()
      .then(allProducts => {
        const products = allProducts.filter(product => product.completed);
        const pendingProducts = allProducts.filter(product => !product.completed);
        return activity.uploadProducts(products)
          .then(records => {
            return _MEMORY.storeProducts(pendingProducts);
          });
      })
      // .then(records => {
      //   console.log('[Upload] completed', records.length);
      // })
      .catch(error => {
        console.log('[Upload] Error: ', error);
      });
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

  loadSiteProfiles().then((sites) => {
    _sites = sites;
  });

  // Airtable test
  var Airtable = require("airtable");
  var base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(
    "app3TPgrNQ8MAaMYI"
  );
  const total = await activity.DB_totalCount({
    apiKey: AIRTABLE_API_KEY,
    baseId: 'app3TPgrNQ8MAaMYI',
    filter: "AND(NOT({URL to Competitor's Product} = ''), {Scraped Completed from URL} = 0)",
  });
  console.log("[Total]", total);
}

function loadData() {
  chrome.storage.local.get(["data"], function (store = {}) {
    const { data } = store;
    appData = data;
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
