class ZulilyScraper extends ShoclefScraper {
  constructor() {
    super();
    
  }

  initInfo() {
    console.log('[ZulilyScraper] init info!');
  }

  doScrap() {
    console.log('[ZulilyScraper] do scrap!');

  }
}

let scraper = new ZulilyScraper();

$(function () {
  console.log("[Script][Action][Zulily.com] Loaded", typeof startScan);
  chrome.storage.local.get(["data"], function (store = {}) {
    const { data } = store;
    console.log('[Data][Loaded]', data);

  });
  // chrome.extension.sendMessage({ type: "requestData" }, function (data) {
  //   discordWebhook = data.discordWebhook;
    
  //   startScan();
  // });

  // addEventListeners();
  
});

function initInfo() {

}

function doScrap() {

}