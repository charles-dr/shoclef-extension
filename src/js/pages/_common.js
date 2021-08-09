$(function() {
  _addEventListeners();
});


function _addEventListeners() {
  chrome.runtime.onMessage.addListener (function(message, sender, sendResponse) {
    const { type, ...payload } = message;
    if (type === _ACTION.SYSTEM_MESSAGE) {
      if (payload.status) {
        toastr.success(payload.message, payload.title);
      } else {
        toastr.error(payload.message, payload.title);
      }
    } else if (type === _ACTION.SETTING_UPDATED) {
      const { data: setting } = payload;
      console.log('[Settings] updated', setting);
      updateTriggerForm(setting);
    }
  });
}

function updateTriggerForm(setting) {
  const iSettings = new AppConfig(setting);
  // if is in index.html
  if (window.location.href.includes('index.html')) {
    $('#toggle-scraping').html(`<i class="la la-${iSettings.scraping ? 'stop' : 'play'}"></i>${iSettings.scraping ? 'Stop' : 'Start'}`);
  }
}