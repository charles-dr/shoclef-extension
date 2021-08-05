
$(function() {
  $('#toggle-scrap-form').on('submit', function(e) {
    e.preventDefault();
    console.log('[Toggle Scraping]');
    chrome.extension.sendMessage({
      type: _ACTION.START_SCRAP,
      max_tabs: $('#max-tabs').val(),
    });
  });
});

function startSraping() {

}

function stopScraping() {

}