class Product {
  url = '';
  baseId = '';
  recordId = '';
  title = '';
  description = '';
  price = 0;
  oldPrice = '';
  currency = 'USD'
  images = [];
  brand = '';
  category = '';
  colors = [];
  sizes = [];
  variants = []; // Array<{ key: string, values: string[] }>
  completed = false;
  scraping = false;
  createdAt = null;
  updatedAt = null;

  constructor({
    url, title, description, price, oldPrice, brand, category,
    images = [], colors = [], sizes = [], variants = [], completed = false, scraping = false,
    createdAt = null, updatedAt = null, baseId = '', recordId = '',
  }) {
    if (!url) {
      throw new Error('Product must have valid URL!');
    }
    this.url = url;
    if (title) this.title = title;
    if (description) this.description = description;
    if (price && price > 0) this.price = price;
    if (oldPrice) this.oldPrice = oldPrice;
    if (brand) this.brand = brand;
    if (category) this.category = category;
    if (images.length) this.images = images;
    if (colors.length) this.colors = colors;
    if (sizes.length) this.sizes = sizes;
    if (variants.length) this.variants = variants;
    this.completed = completed;
    this.scraping = scraping;
    this.baseId = baseId;
    this.recordId = recordId;
    this.createdAt = createdAt || Date.now();
    this.updatedAt = updatedAt || Date.now();
  }

  toObject() {
    return {
      url: this.url,
      baseId: this.baseId,
      recordId: this.recordId,
      title: this.title,
      description: this.description,
      price: this.price,
      oldPrice: this.oldPrice,
      currency: this.currency,
      images: this.images,
      brand: this.brand,
      category: this.category,
      colors: this.colors,
      sizes: this.sizes,
      variants: this.variants,
      completed: this.completed,
      scraping: this.scraping,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

class Website {
  domain = ''
  title = ''
  description = ''
  image = ''
  brand = ''
  category = ''
  price = ''
  oldPrice = ''
  color = ''
  size = ''
  active = ''
  constructor({
    domain, title, description, image, brand, category, price, oldPrice, color, size, active, variants = '',
  }) {
    this.domain = domain;
    this.title = title;
    this.description = description;
    this.image = image;
    this.brand = brand;
    this.category = category;
    this.price = price;
    this.oldPrice = oldPrice;
    this.color = color;
    this.size = size;
    this.variants = variants;
    this.active = active;
  }

  toObject() {
    return {
      domain: this.domain,
      title: this.title,
      description: this.description,
      image: this.image,
      brand: this.brand,
      category: this.category,
      price: this.price,
      oldPrice: this.oldPrice,
      color: this.color,
      size: this.size,
      variants: this.variants,
      active: this.active,
    };
  }
}


class AirtalbeBase {
  id = '';
  name = '';
  status = 'NONE';

  constructor({ id, name, status = 'NONE' }) {
    this.id = id;
    this.name = name;
    this.status = status;
  }

  toObject() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
    };
  }
}

class AirtableConfig {
  apiKey = '';
  bases = []
  currentBase = '';
  constructor({ apiKey = '', bases = [], currentBase = '' }) {
    this.apiKey = apiKey;
    this.bases = bases;
    this.currentBase = currentBase;
  }

  addBase(baseId) {
    this.bases.push(baseId);
    return this.bases;
  }

  setCurrentBase(baseId) {
    if (!this.bases.includes(baseId)) {
      throw new Error('[setCurrentBase] Invalid base id provided!');
    }
    this.currentBase = baseId;
  }

  toObject() {
    return {
      apiKey: this.apiKey,
      bases: this.bases,
      currentBase: this.currentBase,
    };
  }
}

class AppConfig {
  scraping = false;
  maxTabs = 3;
  airtable = new AirtableConfig({});

  constructor({ scraping = false, maxTabs = 3, airtable = {} }) {
    this.scraping = scraping;
    this.maxTabs = maxTabs;
    this.airtable = new AirtableConfig(airtable);
  }

  toObject() {
    return {
      scraping: this.scraping,
      maxTabs: this.maxTabs,
      airtable: this.airtable.toObject(),
    };
  }
}


class TabStatus {
  id = '';
  originURL = '';
  url = '';
  opened = false;
  scraping = false;

  constructor({ id = '', url, opened = false, scraping = false }) {
    this.id = id;
    this.url = url;
    this.originURL = url;
    this.opened = opened;
    this.scraping = scraping;
  }

  urlChanged(url) {
    this.url = url;
  }

  toObject() {
    return {
      id: this.id,
      url: this.url,
      opened: this.opened,
      scraping: this.scraping,
    };
  }
}

class TabStatusManager {
  tabs = [];

  constructor(urls = []) {
    console.log('[TabStatusManager] initialized.');
  }

  getTabIds() {
    return this.tabs.map(tab => tab.id);
  }

  getTabURLs() {
    return this.tabs.map(tab => tab.url);
  }

  getTabOriginURLs() {
    return this.tabs.map(tab => tab.originURL);
  }

  getTabById(tabId) {
    const [tab] = this.tabs.filter(t => t.id === tabId);
    return tab;
  }

  getTabByURL(url) {
    const [tab] = this.tab.filter(t => t.url === url);
    return tab;
  }

  addTab({ url, id = '', opened = false, scraping = false }) {
    this.tabs.push(new TabStatus({ id, url, opened, scraping }));
  }

  tabOpened(url, id) {
    const tabIndex = this.tabs.map(t => t.url).indexOf(url);
    console.log('[TabStatusManager][tabOpended]: ', id, url, tabIndex);
    if (tabIndex > -1) {
      this.tabs[tabIndex].id = id;
      this.tabs[tabIndex].opened = true;
      return this.tabs[tabIndex];
    }
    return false;
  }

  tabURLUpdated(id, url) {
    const tabIndex = this.tabs.map(t => t.id).indexOf(id);
    if(tabIndex > -1) {
      console.log('[TabStatusManager][URL Changed]', id, this.tabs[tabIndex].originURL, url);
      this.tabs[tabIndex].urlChanged(url);
    }
  }

  startedTabScraping(url) {
    const tabIndex = this.tabs.map(t => t.url).indexOf(url);
    if (tabIndex > -1) {
      this.tabs[tabIndex].scraping = true;
      return this.tabs[tabIndex];
    }
    return false;
  }

  deleteTab(url) {
    const tabIndex = this.tabs.map(tab => tab.url).indexOf(url);
    this.tabs.splice(tabIndex, 1);
    return this.tabs;
  }

  deleteTabById(id) {
    const tabIndex = this.tabs.map(tab => tab.id).indexOf(id);
    console.log('[TabStatusManager] deleteTabById', id, tabIndex, this.tabs.length);
    if (tabIndex > -1) {
      this.tabs.splice(tabIndex, 1);
      console.log('[TabStatusManager] deleteTabById', this.tabs);
      return this.tabs;
    } else {
      return false;
    }
  }
}