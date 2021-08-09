const _ACTION = {
  START_SCRAP: 'START_SCRAP',
  STOP_SCRAP: 'STOP_SCRAP',
  DO_SCRAP: 'DO_SCRAP',
  SCRAP_FINISHED: 'SCRAP_FINISHED',
  SYSTEM_MESSAGE: 'SYSTEM_MESSAGE',
  SETTING_UPDATED: 'SETTING_UPDATED',
  UPLOAD_PRODUCT: 'UPLOAD_PRODUCT',
};

const _STORE_KEY = {
  WEBSITES: 'websites',
  PRODUCTS: 'products',
  SETTINGS: 'settings',
  BASES: 'bases',
};

const _BASE_STATUS = {
  NONE: 'NONE',
  RUNNING: 'RUNNING',
  FINISHED: 'FINISHED',
};

const _MEMORY = {
  loadProducts: () => {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get([_STORE_KEY.PRODUCTS], function (store = {}) {
          resolve(store[_STORE_KEY.PRODUCTS] || []);      
        });
      } catch (e) {
        reject(e);
      }
    });
  },
  storeProducts: (products) => {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set({ [_STORE_KEY.PRODUCTS]: products });
        resolve(products);
      } catch (e) {
        reject(e);
      }
    });
  },
  loadProfiles: () => {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get([_STORE_KEY.WEBSITES], function (store = {}) {
          resolve(store[_STORE_KEY.WEBSITES] || []);      
        });
      } catch (e) {
        reject(e);
      }
    });
  },
  storeProfiles: (websites) => {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set({ [_STORE_KEY.WEBSITES]: websites });
        resolve(websites);
      } catch (e) {
        reject(e);
      }
    });
  },
  loadSettings: () => {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get([_STORE_KEY.SETTINGS], (store = {}) => {
          resolve(store[_STORE_KEY.SETTINGS] || {});
        });
      } catch (e) {
        reject(e);
      }
    });
  },
  storeSettings: (settings) => {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set({ [_STORE_KEY.SETTINGS]: settings });
        resolve(settings);
      } catch (e) {
        reject(e);
      }
    });
  },
};

const HOSTS_EMBEDDED = [
  '6pm.com',
  'amazon.com',
  'amazon.in',
  'asos.com',
  'jcrew.com',
  'boozt.com',
  'madewell.com',
];
