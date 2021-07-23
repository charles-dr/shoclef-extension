
$(function() {
  $('#toggle-scrap-form').on('submit', function(e) {
    e.preventDefault();
    console.log('[Toggle Scraping]');
    chrome.extension.sendMessage({ type: _ACTION.START_SCRAP }, function (result) {
      console.log('[Message]', result);
    });
  });
});

function startSraping() {

}

function stopScraping() {

}