

$(function() {
  initPage();

  // addEventListeners();
});

function initPage() {
  chrome.storage.local.get(["data"], function (store = {}) {
    const { data } = store;
    console.log('[Data][Loaded]', data);

    // display webhook
    $('#discord-webhook').val(data.discordWebhook);
  });
}

function addEventListeners() {
  $('#btn-update').on('click', function() {
    if (!confirm('Are you sure to submit data?')) return;

    chrome.storage.local.get(['data'], function(store = {}) {
      const { data } = store;
      if (data.data) delete data.data;
      data.discordWebhook = $('#discord-webhook').val();
      data.time = Date.now();
      chrome.storage.local.set({ data }, function() {
        alert('Data has been saved!');
      })
    })
  })
}