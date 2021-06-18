class ShoclefScraper {
  constructor() {
    console.log('[ShoclefScrper] initialized!');
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
  }

  completeScraping() {
    // submit data to airtable or do something else.
  }
}

$(function () {
  console.log("[Script][All] Loaded!", typeof fetchInfo);
  window.addEventListener("keyup", doKeyPress, false); //add the keyboard handler
});

// if (window == top) {
// }

trigger_key = 13; // enter key
function doKeyPress(e) {
  if (e.ctrlKey && e.keyCode == trigger_key) {
    alert('Hi!')
    scraper.initInfo();
    scraper.doScrap();
    toastr.info('Are you the 6 fingered man?')
  }
}
