class ShoclefScraper {
  siteProfile = {};
  constructor(siteProfile) {
    console.log('[ShoclefScrper] initialized!', siteProfile);
    this.siteProfile = siteProfile;
    this.productInfo = {
      title: '',
      description: '',
      brand: '',
      images: [],
    };
  }

  initStat() {
    console.log('[ShoclefScraper][InitStat] define the function!');
    this.productInfo = {
      title: '',
      description: '',
      brand: '',
      images: [],
    };
  }

  doScrap() {
    // collect data from page.
    console.log('[ShoclefScraper][InitStat] defined the function!');
    toastr.info('Scraping starting...');
  }

  completeScraping() {
    // submit data to airtable or do something else.
  }
}

$(function () {
  console.log("[Script][All] Loaded!", typeof fetchInfo);
  window.addEventListener("keyup", doKeyPress, false); //add the keyboard handler


});

chrome.runtime.onMessage.addListener (function(message, sender, sendResponse) {
  console.log('[Message]', message, sender, sendResponse);
  const { type, site } = message;
  if (type === 'DO_SCRAPING' && site) {
    // start scraping
    console.log('[GO][DO_SCRAPING]');
    startScraping(site);
  }
});

// if (window == top) {
// }

trigger_key = 13; // enter key

function startScraping(siteProfile) {
  const scraper = new ShoclefScraper(siteProfile);
  scraper.doScrap();
}

function doKeyPress(e) {
  if (e.ctrlKey && e.keyCode == trigger_key) {
    alert('Hi!')
    // scraper.initInfo();
    // scraper.doScrap();
    // toastr.info('Are you the 6 fingered man?')
  }
}
