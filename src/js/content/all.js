const __RETURN = {
  TEXT: 'innerText',
  HTML: 'innerHTML',
};
const CONFIG = {
  DELIMITER: '::',
  N_REPEAT_UNTIL_FIND: 10,
};



class ShoclefScraper {
  constructor(product, website) {
    console.log('[ShoclefScrper] initialized!', website, product);
    this.website = new Website(website);
    this.product = new Product(product);
  }

  async doScrap() {
    // collect data from page.
    console.log('[ShoclefScraper][doScrap] GO GO!');
    toastr.info('Start scraping...');
    await this.sleep(1000);
    this.product.title = await this.findSingleValue(this.website.title, __RETURN.TEXT);
    this.product.description = await this.findSingleValue(this.website.description, __RETURN.HTML);
    this.product.brand = await this.findSingleValue(this.website.brand, __RETURN.TEXT);
    this.product.category = await this.findSingleValue(this.website.category, __RETURN.TEXT);
    this.product.price = await this.findSingleValue(this.website.price, __RETURN.TEXT);
    this.product.oldPrice = await this.findSingleValue(this.website.oldPrice, __RETURN.TEXT);
    this.product.sizes = await this.findMultipleValue(this.website.size, __RETURN.TEXT);
    this.product.images = await this.getImages();

    console.log('[Scrap][Test]', this.product.toObject())
    this.completeScraping();
  }

  async findSingleValue(selector, returnType , repeat = 0) {
    const element = document.querySelectorAll(selector)[0];
    if (element) {
      console.log('[found element]', repeat);
      toastr.success(`Found the element in ${repeat} repeat.`);
      return element[returnType];
    }
    if (repeat > CONFIG.N_REPEAT_UNTIL_FIND) {
      toastr.error('Failed to find element', 'Shoclef Scraper');
      return '';
    }
    await this.sleep(100);
    return this.findSingleValue(selector, returnType, repeat + 1);
  }

  async findMultipleValue(selector, returnType , repeat = 0) {
    const elements = document.querySelectorAll(selector);
    if (elements && elements.length) {
      console.log('[found element]', repeat);
      toastr.success(`Found the element in ${repeat} repeat.`);
      const vals = [];
      elements.forEach(element => {
        vals.push(element[returnType]);
      })
      return vals;
    }
    if (repeat > CONFIG.N_REPEAT_UNTIL_FIND) {
      toastr.error('Failed to find element', 'Shoclef Scraper');
      return '';
    }
    await this.sleep(100);
    return this.findMultipleValue(selector, returnType, repeat + 1);
  }

  async getCategory() {
    console.warn('[getCategory] define the function!');
  }

  async getPrice() {
    console.warn('[getPrice] define the function!');
  }

  async getOldPrice() {
    console.warn('[getOldPrice] define the function!');
  }

  async getSizes() {
    console.warn('[getSizes] define the function!');
  }

  async getImages() {
    console.warn('[getImages] define the function');
  }

  completeScraping() {
    // submit data to airtable or do something else.
    console.log('[Scrap][Completed]', this.product);
  }

  async sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, ms);      
    });
  }
}

class PM6Scraper extends ShoclefScraper {
  constructor(product, website = {}) {
    console.log('[6PMScraper] initialized!', product, website);
    super(product, website);
  }

  async doScrap() {
    console.log('[6PMScraper] starting...');
    await this.sleep(1000);
    this.product.title = await this.findSingleValue('#overview', __RETURN.TEXT);
    this.product.description = await this.findSingleValue('[itemprop="description"]', __RETURN.HTML);
    this.product.brand = await this.findSingleValue('#overview [itemprop="brand"]', __RETURN.TEXT);
    this.product.category = await this.getCategory();
    this.product.price = await this.getPrice();
    this.product.oldPrice = await this.getOldPrice();
    this.product.sizes = await this.getSizes();
    this.product.colors = await this.getColors();
    this.product.images = await this.getImages();

    this.completeScraping();
  }

  async getCategory() {
    const anchors = document.querySelectorAll('#breadcrumbs > div > a');
    const arr_category = [];
    for (let i = 1; i < anchors.length - 1; i++) {
      arr_category.push(anchors[i].innerText);
    }
    return arr_category.join(CONFIG.DELIMITER);
  }

  async getPrice() {
    return Number(document.querySelectorAll('.Up-z .Vy-z .Xy-z')[0].innerText.replace('$', ''));
  }

  async getOldPrice() {
    return Number(document.querySelectorAll('.Up-z .Vy-z .gz-z')[0].innerText.replace('$', ''));
  }

  async getSizes() {
    const sizes = [];
    const options = document.querySelectorAll('#pdp-size-select option');
    if (options.length) {
      options.forEach(option => {
        sizes.push(option.innerText);
      });
    }
    return sizes.join(CONFIG.DELIMITER);
  }

  async getColors() {
    const colors = [];
    const options = document.querySelectorAll('#pdp-color-select option');
    const [oneColor] = document.querySelectorAll('#buyBoxForm > div:first-child .HB-z');

    if (options.length) {
      options.forEach(option => {
        colors.push(option.innerText);
      });
    } else if (oneColor) {
      colors.push(oneColor.innerText);
    }
    return colors.join(CONFIG.DELIMITER);
  }

  async getImages() {
    const swatches = document.querySelectorAll('#swatchPicker img');
    const listOfImages = [];

    const getImageOfSwatch= async () => {
      const thumbnails = document.querySelectorAll('#thumbnailsList img');
      const images = [];
      for (let i = 0; i < thumbnails.length; i++) {
        thumbnails[i].click();
        await this.sleep(50);
        images.push(document.querySelectorAll('#productImages .gB-z .qB-z img')[0].getAttribute('src'));        
      }
      return images;
    };

    if (swatches.length) {
      for (let i = 0; i < swatches.length; i++) {
        swatches[i].click();
        await this.sleep(100);
        listOfImages.push(await getImageOfSwatch());        
      }
    } else {
      listOfImages.push(await getImageOfSwatch());
    }
    return listOfImages.reduce((_imgs, list) => _imgs = _imgs.concat(list), []);
  }
}

const mapHost2Scraper = {
  '6pm.com': PM6Scraper,
};

$(function () {
  console.log("[Script][All] Loaded!", typeof fetchInfo);
  // window.addEventListener("keyup", doKeyPress, false); //add the keyboard handler
  startScraping();
});

chrome.runtime.onMessage.addListener (function(message, sender, sendResponse) {
  const { type, site, product } = message;
  if (type === _ACTION.START_SCRAP && site && product) {
    // const scraper = new ShoclefScraper(site, product);
    startScraping(product, site);
  }
});

function startScraping(product = null, site = {}) {
  product = product || { url: location.href };
  const scraper = selectScraper(product, site);
  scraper.doScrap();
}

function selectScraper(product, site) {
  const host = new URL(location.href).host.replace('www.', '');
  const Scraper = mapHost2Scraper[host] !== undefined ? mapHost2Scraper[host] : ShoclefScraper;
  return new Scraper(product, site);
}

// if (window == top) {
// }

trigger_key = 13; // enter key

function doKeyPress(e) {
  if (e.ctrlKey && e.keyCode == trigger_key) {
    alert('Hi!')
    // scraper.initInfo();
    // scraper.doScrap();
    // toastr.info('Are you the 6 fingered man?')
  }
}
