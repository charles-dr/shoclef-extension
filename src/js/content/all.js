const __RETURN = {
  TEXT: 'innerText',
  HTML: 'innerHTML',
};
const CONFIG = {
  DELIMITER: '::',
  N_REPEAT_UNTIL_FIND: 10,
};
const CURRENCY = {
  "$": "USD",
  "¥": "JPY",
  "£": "EUR",
  "£": "GBP",
  "lei": "RON",
  "kr": "SEK",
  "₺": "TRY",
  "₴": "UAH",
  "zł": "PLN",
  "₹": "INR",
  "元": "CNY",
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
      return [];
    }
    await this.sleep(100);
    return this.findMultipleValue(selector, returnType, repeat + 1);
  }

  async getCategory() {
    console.warn('[getCategory] define the function!');
    return '';
  }

  async getPrice() {
    console.warn('[getPrice] define the function!');
    return 0;
  }

  async getOldPrice() {
    console.warn('[getOldPrice] define the function!');
    return 0;
  }

  async getSizes() {
    console.warn('[getSizes] define the function!');
    return [];
  }

  async getImages() {
    console.log('[getImages] define the function');
    return [];
  }  
  
  async getVariants() {
    console.log('[getVariants] define the function!');
    return [];
  }

  completeScraping() {
    // submit data to airtable or do something else.
    console.log('[Scrap][Completed]', typeof this.product, this.product);
    try {
      // chrome.extension.sendMessage({ type: _ACTION.SCRAP_FINISHED, product: this.product });
    } catch (e) {
      console.log('[Scrap][Event][Completed] Error: ', e);
    }
  }

  extractNumber(str_src) {
    const NUMERIC_REGEXP = /[-]{0,1}[\d]*(,)*[\d]*[.]{0,1}[\d]+/g;
    const p_num = str_src.match(NUMERIC_REGEXP)[0];
    return p_num;
  }

  analyzePriceCurrency(src) {
    const NUMERIC_REGEXP = /[-]{0,1}[\d]*(,)*[\d]*[.]{0,1}[\d]+/g;
    const COMMA_REGEXP = /,/g
    const p_num = src.match(NUMERIC_REGEXP)[0];
    const p_currency = src.replace(p_num, '').trim();
    const currency = CURRENCY[p_currency] || p_currency;
    const price = Number(p_num.replace(COMMA_REGEXP, ''));
    return { currency, price };
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
    this.product.variants = await this.getVariants();

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
    return Number(document.querySelectorAll('#productRecap > div > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(2) > span[aria-label]')[0].innerText.replace('$', ''));
  }

  async getOldPrice() {
    return Number(
      document.querySelectorAll('#productRecap > div > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(2) > span:not([aria-label])')[0]
        .innerText
        .replace('$', '')
        .replace('MSRP:', '')
    );
  }

  async getSizes() {
    const sizes = [];
    const options = document.querySelectorAll('#pdp-size-select option');
    if (options.length) {
      options.forEach(option => {
        sizes.push(option.innerText);
      });
    }
    return sizes;
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
    return colors;
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
        images.push(document.querySelectorAll('#productImages button[aria-label="Zoom into product image"] img')[0].getAttribute('src'));        
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

class Amazoncraper extends ShoclefScraper {
  constructor(product, website = {}) {
    console.log('[Amazoncraper] initialized!', product, website);
    super(product, website);
  }

  async doScrap() {
    console.log('[Amazoncraper] starting...');
    await this.sleep(1000);
    this.product.title = await this.findSingleValue('#title', __RETURN.TEXT);
    this.product.description = await this.getDescription();
    this.product.brand = await this.getBrand();
    this.product.category = await this.getCategory();
    this.product.price = await this.getPrice();
    this.product.oldPrice = await this.getOldPrice();
    this.product.sizes = await this.getSizes();
    this.product.colors = await this.getColors();
    this.product.images = await this.getImages();
    this.product.variants = await this.getVariants();

    this.completeScraping();
  }

  async getDescription() {
    let description = '';
    try {
      const feature_overview = document.querySelectorAll('#productOverview_feature_div > div')[0];
      if (feature_overview) {
        description += feature_overview.innerHTML;
      }
      const feature_bullets = document.querySelectorAll('#featurebullets_feature_div > #feature-bullets > ul')[0];
      if (feature_bullets) {
        description += feature_bullets.innerHTML;
      }
      toastr.success('Success to find the description', 'ShoclefScraper');
    } catch (e) {
      console.log('[AmazonScraper][getDescription]', e.message);
      toastr.error('[AmazonScraper]Failed to find description!', 'ShoclefScraper');
    }
    return description;
  }

  async getBrand() {
    const target_element = document.querySelectorAll('#bylineInfo_feature_div')[0];
    if (!target_element) return '';
    const str = target_element.innerText;

    const regx1 = new RegExp('Visit the .+ Store');
    const regx2 = new RegExp('Brand: .+');
    if (str.match(regx1)) {
      return str.match(regx1)[0]
        .replace('Visit the', '')
        .replace('Store', '')
        .trim();
    } else if (str.match(regx2)) {
      return str.match(regx2)[0]
        .replace('Brand:', '')
        .trim();
    }
    return '';
  }

  async getCategory() {
    try {
      const items = document.querySelectorAll('#wayfinding-breadcrumbs_feature_div ul > li:not(.a-breadcrumb-divider)');
      const categories = [];
      items.forEach(item => categories.push(item.innerText));
      toastr.success('Success', 'Category');
      return categories.join(CONFIG.DELIMITER);
    } catch (e) {
      taostr.error('Failure', 'Category');
      return '';
    }
  }

  async getPrice() {
    try {
      return Number(document.querySelectorAll('#price_inside_buybox')[0].innerText.replace('$', ''));
    } catch (e) {
      return 0;
    }
  }

  async getOldPrice() {
    return this.getPrice();
  }

  async getSizes() {
    const sizes = [];
    const options = document.querySelectorAll('#variation_size_name select[name=dropdown_selected_size_name] option');
    if (options.length) {
      options.forEach(option => {
        if (option.value !== '-1') {
          sizes.push(option.innerText);
        }
      });
    }
    const swatches = document.querySelectorAll('#variation_size_name > ul > li');
    if (swatches.length) {
      swatches.forEach(swatch => sizes.push(swatch.innerText));
    }
    return sizes;
  }

  async getColors() {
    const colors = [];
    const colorImages = document.querySelectorAll('#variation_color_name > ul > li img.imgSwatch');
    colorImages.forEach(image => {
      colors.push(image.getAttribute('alt'));
    })
    return colors;
  }

  async getImages() {
    const images = [];
    // click all thumbnails to add to the main container.
    const thumbnails = document.querySelectorAll('#altImages > ul > li.a-spacing-small.item.imageThumbnail img');
    thumbnails.forEach(async thumbnail => {
      thumbnail.click();
      await this.sleep(10);
    });
    // now collect the images.
    const targets = document.querySelectorAll('#main-image-container ul > li.image.item img');
    try {
      targets.forEach(target => images.push(target.getAttribute('src')));
    } catch (e) {
      console.log('[GetImage]', e.message);
    }
    return images;
  }

  async getVariants() {
    const variants = [];
    // style
    const styles = [];
    const targets = document.querySelectorAll('#variation_style_name > ul > li');
    const targets2 = document.querySelectorAll('#variation_style_name select[name=dropdown_selected_style_name] option')
    if (targets.length) {
      targets.forEach(target => styles.push(target.innerText));
    } else if (targets2.length) {
      targets.forEach(target => styles.push(target.innerText));
    }
    if (styles.length) {
      variants.push({
        key: 'style',
        values: styles,
      });
    }
    return variants;
  }
}

class AsosScraper extends ShoclefScraper {
  constructor(product, website = {}) {
    console.log('[Amazoncraper] initialized!', product, website);
    super(product, website);
  }

  async doScrap() {
    console.log('[Amazoncraper] starting...');
    await this.sleep(1000);
    this.product.title = await this.findSingleValue('#aside-content > .product-hero > h1', __RETURN.TEXT);
    this.product.description = await this.findSingleValue('#product-details-container', __RETURN.HTML);
    this.product.brand = await this.getBrand();
    this.product.category = await this.getCategory();
    this.product.price = await this.getPrice();
    this.product.oldPrice = await this.getOldPrice();
    this.product.sizes = await this.getSizes();
    this.product.colors = await this.getColors();
    this.product.images = await this.getImages();
    this.product.variants = await this.getVariants();

    this.completeScraping();
  }

  async getBrand() {
    try {
      return document.querySelectorAll('#product-details-container .product-description > p a:nth-child(2)')[0].innerText;
    } catch (e) {
      return '';
    }
  }

  async getCategory() {
    try {
      return document.querySelectorAll('#product-details-container .product-description > p a:nth-child(1)')[0].innerText;
    } catch (e) {
      return '';
    }
  }

  async getPrice() {
    try {
      return Number(document.querySelectorAll('[data-id=current-price]')[0].innerText.replace('$', '').replace('Now', ''));
    } catch (e) {
      return 0;
    }
  }

  async getOldPrice() {
    const oldPrice = Number(document.querySelectorAll('[data-id=previous-price]')[0].innerText.replace('$', '').replace('Was', ''));
    if (!oldPrice) {
      return this.getPrice();
    }
    return oldPrice;
  }

  async getSizes() {
    const sizes = [];
    const options = document.querySelectorAll('[data-id=sizeSelect]:nth-child(1) option');
    if (options.length) {
      options.forEach((option, i) => {
        if (i > 0) {
          sizes.push(option.innerText.replace('- Not available', '').trim());
        }
      });
    }

    return sizes;
  }

  async getColors() {
    const colors = [];
    try {
      const targets = document.querySelectorAll('.colour-size.colour-component .colour-section .product-colour');
      if (targets.length) {
        colors.push(targets[0].innerText);
      }
    } catch (e) {}
    return colors;
  }

  async getImages() {
    const images = [];
    // click all thumbnails to add to the main container.
    const thumbnails = document.querySelectorAll('.gallery-aside-wrapper .thumbnails .image-thumbnail img');
    // thumbnails.forEach(async thumbnail => {
    //   thumbnail.click();
    //   await this.sleep(10);
    // });
    // now collect the images.
    const targets = document.querySelectorAll('#product-gallery div.amp-page.amp-spin > div.amp-page.amp-images > div > div > img')
    try {
      targets.forEach(target => images.push(target.getAttribute('src')));
    } catch (e) {
      console.log('[GetImage]', e.message);
    }
    return images
      .filter((url, i, self) => self.indexOf(url) === i);
  }

  async getVariants() {
    const variants = [];
    return variants;
  }
}

class JcrewScraper extends ShoclefScraper {
  constructor(product, website = {}) {
    console.log('[JcrewScraper] initialized!', product, website);
    super(product, website);
  }

  async doScrap() {
    console.log('[JcrewScraper] starting...');
    await this.sleep(1000);
    this.product.title = await this.findSingleValue('#product-name__p', __RETURN.TEXT);
    this.product.description = await this.findSingleValue('#product-description', __RETURN.HTML);
    this.product.brand = 'J.CREW';
    this.product.category = await this.getCategory();
    this.product.price = await this.getPrice();
    this.product.oldPrice = await this.getOldPrice();
    this.product.sizes = await this.getSizes();
    this.product.colors = await this.getColors();
    this.product.images = await this.getImages();
    this.product.variants = await this.getVariants();

    this.completeScraping();
  }

  async getBrand() {
    try {
      return document.querySelectorAll('#product-details-container .product-description > p a:nth-child(2)')[0].innerText;
    } catch (e) {
      return '';
    }
  }

  async getCategory() {
    try {
      const url = new URL(location.href);
      let tokens = url.pathname.trim().split('/');
      tokens.splice(0, 3);
      tokens.splice(tokens.length - 2, 2);
      tokens.splice(1, 1);
      return tokens.join(CONFIG.DELIMITER);
    } catch (e) {
      return '';
    }
  }

  async getPrice() {
    try {
      const salePriceElement = document.querySelectorAll('[data-qaid=pdpProductPriceSale]')[0];
      const oldPriceElement = document.querySelectorAll('[data-qaid=pdpProductPriceRegular]')[0];
      let src_string = '';
      if (salePriceElement) {
        src_string = salePriceElement.innerText.replace(/\([^)]+\)/, '');
      } else {
        src_string = oldPriceElement.innerText;
      }
      const { currency, price } = this.analyzePriceCurrency(src_string);
      this.product.currency = currency;
      return price;
    } catch (e) {
      return 0;
    }
  }

  async getOldPrice() {
    const str_price = await this.findSingleValue('[data-qaid=pdpProductPriceRegular]', __RETURN.TEXT);
    const str_num = this.extractNumber(str_price);
    return Number(str_num);
  }

  async getSizes() {
    const sizes = [];
    const options = document.querySelectorAll('#c-product__sizes div.c-sizes-list .js-product__size');
    if (options.length) {
      options.forEach((option, i) => {
        sizes.push(option.innerText.replace('- Not available', '').trim());
      });
    }
    return sizes;
  }

  async getColors() {
    const colors = [];
    try {
      const targets = document.querySelectorAll('#c-product__price-colors div.product__group div.product__colors div.js-product__color');
      if (targets.length) {
        const formatColor = (color) => color.split(' ').map(word => word.charAt(0).toUpperCase() + word.substring(1, word.length).toLowerCase()).join(' ');
        targets.forEach(target => {
          colors.push(formatColor(target.getAttribute('data-name')));
        })
      }
    } catch (e) {}
    return colors;
  }

  async getImages() {
    const swatches = document.querySelectorAll('#c-product__price-colors div.product__group div.product__colors div.js-product__color');
    const listOfImages = [];

    const getImageOfSwatch= async () => {
      const thumbnails = document.querySelectorAll('#c-product__photos ul img.product__image--thumbnail');
      const images = [];
      for (let i = 0; i < thumbnails.length; i++) {
        thumbnails[i].click();
        await this.sleep(50);
        const image_element = document.querySelectorAll('[data-qaid="pdpProductGalleryGalleryItemHeroImage"]')[0];
        if (image_element) {
          images.push(image_element.getAttribute('src'));        
        }
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

  async getVariants() {
    const variants = [];
    const variantGroups = document.querySelectorAll('#c-product__variations .product__variations-list');
    try {
      variantGroups.forEach(async (variantElement) => {
        const key = variantElement.querySelectorAll('.description-list .product__label')[0].innerText.replace(':', '').trim();
        const items = variantElement.querySelectorAll('ul[data-qaid=pdpProductVariationsWrapper] li.js-product__variation');
        const values = [];
        items.forEach(item => values.push(item.innerText));
        variants.push({ key, values });
      });
    } catch (e) {}
    return variants;
  }
}

class BooztScraper extends ShoclefScraper {
  constructor(product, website = {}) {
    console.log('[BooztScraper] initialized!', product, website);
    super(product, website);
    this.getColors = this.getColors.bind(this);
  }

  async doScrap() {
    console.log('[BooztScraper] starting...');
    await this.sleep(1000);
    this.product.currency = "EUR";
    this.product.title = await this.findSingleValue('.pp-product__sidebar .pp-info__name', __RETURN.TEXT);
    this.product.description = await this.findSingleValue('#pp-tabs .pp-tabs__content .pp-content__block--product-description', __RETURN.HTML);
    this.product.brand = await this.findSingleValue('.pp-product__sidebar .pp-info__brand', __RETURN.TEXT);
    this.product.category = await this.getCategory();
    this.product.price = await this.getPrice();
    this.product.oldPrice = await this.getOldPrice();
    this.product.sizes = await this.getSizes();
    this.product.colors = await this.getColors();
    this.product.images = await this.getImages();
    this.product.variants = await this.getVariants();

    this.completeScraping();
  }

  async getCategory() {
    try {
      const anchors = document.querySelectorAll('.navigation__breadcrumbs .pv-breadcrumb .pv-breadcrumb__list a');
      const categories = [];
      anchors.forEach(anchor => {
        categories.push(anchor.innerText.replace('/', '').trim());
      })
      return categories.join(CONFIG.DELIMITER);
    } catch (e) {
      return '';
    }
  }

  async getPrice() {
    try {
      const element = document.querySelectorAll('.pp-price .pp-price__text')[0];
      return Number(element.innerText.replace('€', '').trim());
    } catch (e) {
      return 0;
    }
  }

  async getOldPrice() {
    try {
      const element = document.querySelectorAll('.pp-price .pp-price__text-old')[0];
      return Number(element.innerText.replace('€', '').trim());
    } catch (e) {
      return 0;
    }
  }

  async getSizes() {
    const sizes = [];
    const options = document.querySelectorAll('.pp-size-selector .pp-size-selector__size');
    if (options.length) {
      options.forEach((option, i) => {
        sizes.push(option.innerText.trim());
      });
    }
    return sizes;
  }

  async getColors() {
    const colors = [];
    const checkIntersectWithTitle = (str1, str2) => {
      const len = Math.min(str1.length, str2.length);
      for (let i = 0; i < len; i ++) {
        if (str1.charAt(i) !== str2.charAt(i)) {
          return str1.substr(0, i - 1);
        }
      }
      return str1.substr(0, len);
    }
    const formatColor = (color) => {
      const intersect = checkIntersectWithTitle(color, this.product.title);
      return color.replace((intersect || "").trim(), '').trim();
    }
    try {
      const targets = document.querySelectorAll('.pp-colour-selector .pp-colour-selector__colour img');
      if (targets.length) {
        targets.forEach(target => {
          colors.push(formatColor(target.getAttribute('alt')));
        });
      }
    } catch (e) {
      console.log('[Colors]', e);
    }
    return colors;
  }

  async getImages() {
    const swatches = document.querySelectorAll('.pp-colour-selector .pp-colour-selector__colour img');
    const listOfImages = [];

    const getImageOfSwatch= async () => {
      const thumbnails = document.querySelectorAll('.pp-gallery__thumbs .pp-gallery__thumb');
      const images = [];
      for (let i = 0; i < thumbnails.length; i++) {
        thumbnails[i].click();
        await this.sleep(50);
        document.querySelectorAll('.pp-gallery__images .pp-gallery__image > img').forEach(img => {
          images.push(img.getAttribute('src'));
        });
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
    return listOfImages
      .reduce((_imgs, list) => _imgs = _imgs.concat(list), [])
      .filter((url, i, self) => self.indexOf(url) === i);
  }

  async getVariants() {
    return [];
  }
}

class MadeWellScraper extends ShoclefScraper {
  constructor(product, website = {}) {
    console.log('[BooztScraper] initialized!', product, website);
    super(product, website);
    this.getColors = this.getColors.bind(this);
  }

  async doScrap() {
    console.log('[BooztScraper] starting...');
    await this.sleep(1000);
    this.product.currency = "EUR";
    this.product.title = await this.findSingleValue('#pdpMain .product-main-content .product-name', __RETURN.TEXT);
    this.product.description = await this.findSingleValue('.product-accordion .a11yAccordionHideArea', __RETURN.HTML);
    this.product.brand = 'Madewell'
    this.product.category = await this.getCategory();
    this.product.price = await this.getPrice();
    this.product.oldPrice = await this.getOldPrice();
    this.product.sizes = await this.getSizes();
    this.product.colors = await this.getColors();
    this.product.images = await this.getImages();
    this.product.variants = await this.getVariants();

    this.completeScraping();
  }

  async getCategory() {
    try {
      const anchors = document.querySelectorAll('.breadcrumb.pdp-breadcrumbs li.breadcrumb-cat');
      const categories = [];
      anchors.forEach(anchor => {
        categories.push(anchor.innerText.trim());
      })
      return categories.join(CONFIG.DELIMITER);
    } catch (e) {
      return '';
    }
  }

  async getPrice() {
    try {
      const str_price = (await this.findSingleValue('.product-usd .product-price .price-sales', __RETURN.TEXT)).replace('Sale Price', '');
      const NUMERIC_REGEXP = /[-]{0,1}[\d]*(,)*[\d]*[.]{0,1}[\d]+/g;
      const COMMA_REGEXP = /,/g
      const p_num = str_price.match(NUMERIC_REGEXP)[0];
      const p_currency = str_price.replace(p_num, '').trim();
      this.product.currency = CURRENCY[p_currency];
      return Number(p_num.replace(COMMA_REGEXP, ''));
    } catch (e) {
      console.log('[Price]', e);
      return 0;
    }
  }

  async getOldPrice() {
    return 0;
  }

  async getSizes() {
    const sizes = [];
    const options = document.querySelectorAll('.swatches.size li');
    if (options.length) {
      options.forEach((option, i) => {
        sizes.push(option.innerText.split('\n')[0].trim());
      });
    }
    return sizes;
  }

  async getColors() {
    const colors = [];
    const formatColor = (color) => color.split(' ').map(word => word.charAt(0).toUpperCase() + word.substring(1, word.length).toLowerCase()).join(' ');
    try {
      const targets = document.querySelectorAll('ul.swatches.color > li > a');
      if (targets.length) {
        targets.forEach(target => {
          colors.push(
            formatColor(
              target
                .getAttribute('title')
                .replace('Select Color:', '')
                .trim()
            )
          );
        });
      }
    } catch (e) {
      console.log('[Colors]', e);
    }
    return colors;
  }

  async getImages() {
    const swatches = document.querySelectorAll('ul.swatches.color > li > a');
    const listOfImages = [];

    const getImageOfSwatch= async () => {
      const thumbnails = document.querySelectorAll('#pdpMain .product-images-wrapper .product-images .product-images-desktop .product-images-desktop__column .product-image-wrapper img');
      const images = [];
      for (let i = 0; i < thumbnails.length; i++) {
        images.push(thumbnails[i].getAttribute('src'));
      }
      return images;
    };
    listOfImages.push(await getImageOfSwatch());
    return listOfImages
      .reduce((_imgs, list) => _imgs = _imgs.concat(list), [])
      .filter((url, i, self) => self.indexOf(url) === i);
  }

  async getVariants() {
    return [];
  }
}

class NordStromScraper extends ShoclefScraper {
  constructor(product, website = {}) {
    console.log('[BooztScraper] initialized!', product, website);
    super(product, website);
    this.getColors = this.getColors.bind(this);
  }

  async doScrap() {
    console.log('[BooztScraper] starting...');
    await this.sleep(1000);
    this.product.currency = "$";
    this.product.title = await this.findSingleValue('#product-page-product-title-lockup h1[itemprop=name]', __RETURN.TEXT);
    this.product.description = await this.findSingleValue('#details-and-size', __RETURN.HTML);
    this.product.brand = await this.findSingleValue('#product-page-product-title-lockup span[itemprop=name]', __RETURN.TEXT);
    this.product.category = '';
    this.product.price = await this.getPrice();
    this.product.oldPrice = await this.getOldPrice();
    this.product.sizes = await this.getSizes();
    this.product.colors = await this.getColors();
    this.product.images = await this.getImages();
    this.product.variants = await this.getVariants();

    this.completeScraping();
  }

  async getCategory() {
    try {
      const anchors = document.querySelectorAll('.breadcrumb.pdp-breadcrumbs li.breadcrumb-cat');
      const categories = [];
      anchors.forEach(anchor => {
        categories.push(anchor.innerText.trim());
      })
      return categories.join(CONFIG.DELIMITER);
    } catch (e) {
      return '';
    }
  }

  async getPrice() {
    try {
      const str_price = (await this.findSingleValue('#current-price-string', __RETURN.TEXT)).replace('$', '');
      return Number(str_price);
    } catch (e) {
      console.log('[Price]', e);
      return 0;
    }
  }

  async getOldPrice() {
    return 0;
  }

  async getSizes() {
    const sizes = [];
    try {
      // click selection wrapper
      const selectElement = document.querySelectorAll('#size-filter-product-page-anchor')[0];
      if (!selectElement) throw new Error('Not found the size list wrapper!');
      selectElement.click();

      await this.sleep(300);
      // check the size item in the size list.
      const sizeList = document.querySelectorAll('#size-filter-product-page-option-list')[0];
      if (!sizeList) throw new Error('Not found the size list!');

      sizeList.querySelectorAll('li').forEach(element => {
        const size = element.querySelectorAll('div div span span span')[0].innerText;
        if (size) {
          sizes.push(size);
        }
      });
    } catch (error) {
      console.log('[getSizes]', error);
    }
    return sizes;
  }

  async getColors() {
    const colors = [];
    try {
      // check the existence of the selection wrapper and click it.
      const selectionWrapper = document.querySelectorAll('#color-filter-product-page-anchor')[0];

      const singleColor = document.querySelectorAll('#desktop-sku-filters > div:nth-child(4)')[0];
      // if there is no selection wrapper and a single color exists, return it only.
      if (!selectionWrapper && singleColor) return [singleColor.innerText];
      
      if (!selectionWrapper) throw new Error('Not found the color selection wrapper!');

      selectionWrapper.click();
      await this.sleep(300);

      // now get the color list.
      document.querySelectorAll('#color-filter-product-page-option-list li span span span').forEach(item => {
        colors.push(item.innerText);
      });
    } catch (error) {
      console.log('[getColors]', error);
    }
    return colors;
  }

  async getImages() {
    const swatches = document.querySelectorAll('ul#product-page-swatches > li > button');
    const listOfImages = [];

    const getImageOfSwatch= async () => {
      const thumbnails = document.querySelectorAll('#product-page-thumbnail-gallery .slider .slider-frame ul li div button img');
      const images = [];
      for (let i = 0; i < thumbnails.length; i++) {
        thumbnails[i].click();
        await this.sleep(100);
        const t_imgs = document.querySelectorAll('#pdp img[name="mobile-gallery-image"]');
        const target = t_imgs[t_imgs.length - 1];
        images.push(target.getAttribute('src'));
      }
      return images;
    };
    if (swatches.length) {
      for (let j = 0; j < swatches.length; j++) {
        swatches[j].click();
        console.log('[Swatch] clicked', j, swatches[j]);
        await this.sleep(300);
        listOfImages.push(await getImageOfSwatch());
      }
    } else {
      listOfImages.push(await getImageOfSwatch());
    }
    return listOfImages
      .reduce((_imgs, list) => _imgs = _imgs.concat(list), [])
      .filter((url, i, self) => self.indexOf(url) === i);
  }

  async getVariants() {
    return [];
  }
}

const mapHost2Scraper = {
  '6pm.com': PM6Scraper,
  'amazon.com': Amazoncraper,
  'amazon.in': Amazoncraper,
  'asos.com': AsosScraper,
  'boozt.com': BooztScraper,
  'jcrew.com': JcrewScraper,
  'madewell.com': MadeWellScraper,
  'nordstrom.com': NordStromScraper ,
};

$(function () {
  console.log("[Script][All] Loaded!", typeof fetchInfo);
  // window.addEventListener("keyup", doKeyPress, false); //add the keyboard handler
  startScraping();
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  const { type, site, product } = message;
  if (type === _ACTION.START_SCRAP && site && product) {
    // const scraper = new ShoclefScraper(site, product);
    startScraping(product, site);
  }
});

function startScraping(product = null, site = {}) {
  const [host] = Object.keys(mapHost2Scraper).filter(key => window.location.href.includes(key));
  if (!host) return false;
  product = product || { url: location.href };
  const scraper = selectScraper(product, site);
  scraper.doScrap();
}

function selectScraper(product, site) {
  const host = new URL(location.href).host.replace('www.', '');
  console.log('[ShoclefScraper][Host]', host);
  const [mainHost] = Object.keys(mapHost2Scraper).filter(mh => host.includes(mh));
  const Scraper = mainHost && mapHost2Scraper[mainHost] !== undefined ? mapHost2Scraper[mainHost] : ShoclefScraper;
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
