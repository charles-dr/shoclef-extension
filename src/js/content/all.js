const __RETURN = {
  TEXT: 'innerText',
  HTML: 'innerHTML',
};
class ShoclefScraper {
  constructor(website, product) {
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


    console.log('[Scrap][Test]', this.product.toObject())
  }

  async findSingleValue(selector, returnType , repeat = 0) {
    const element = document.querySelectorAll(selector)[0];
    if (element) {
      console.log('[found element]', repeat);
      toastr.success(`Found the element in ${repeat} repeat.`);
      return element[returnType];
    }
    if (repeat > 10) {
      toastr.error('Failed to find element', 'Shoclef Scraper');
      return '';
    }
    await this.sleep(100);
    return this.findSingleValue(selector, returnType, repeat + 1);
  }

  async findMultipleValue(selector, returnType , repeat = 0) {
    const element = document.querySelectorAll(selector)[0];
    if (element) {
      console.log('[found element]', repeat);
      toastr.success(`Found the element in ${repeat} repeat.`);
      return element[returnType];
    }
    if (repeat > 10) {
      toastr.error('Failed to find element', 'Shoclef Scraper');
      return '';
    }
    await this.sleep(100);
    return this.findSingleValue(selector, returnType, repeat + 1);
  }

  completeScraping() {
    // submit data to airtable or do something else.
  }

  async sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, ms);      
    });
  }
}

$(function () {
  console.log("[Script][All] Loaded!", typeof fetchInfo);
  // window.addEventListener("keyup", doKeyPress, false); //add the keyboard handler

});

chrome.runtime.onMessage.addListener (function(message, sender, sendResponse) {
  const { type, site, product } = message;
  if (type === _ACTION.START_SCRAP && site && product) {
    const scraper = new ShoclefScraper(site, product);
    scraper.doScrap();
  }
});

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
