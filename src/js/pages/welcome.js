const initData = {
  discordWebhook: 'https://discord.com/api/webhooks/837812705514749963/AY62TnOMoQ4Gk8rA56HV2SAXmhFImjPY1yDR8uuE-QOhw-Qo2lkayepxXoNHoGuNpUky',
};

$(function() {
  syncDataFormat();
});

function syncDataFormat() {
  chrome.storage.local.get(["data"], function (store = {}) {
    let { data } = store;
    if (!data) { data = {}; }
    Object.keys(initData).forEach((key) => {
      data[key] = data[key] || initData[key];
    });
    chrome.storage.local.set({ ...store, data }, function() {
      moveToOptions();
    })
  });
}

function moveToOptions() {
  setTimeout(function() {
    chrome.tabs.create({ url: 'src/pages/options.html' });
  }, 1000);
}