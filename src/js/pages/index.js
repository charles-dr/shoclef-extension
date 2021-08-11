
$(function() {
  fillStartScrapForm();

  $('#toggle-scrap-form').on('submit', function(e) {
    e.preventDefault();
    if (!confirm('Are you sure to start scraping?')) return;
    const data = validateStartAction();
    console.log('[Toggle Scraping]');
    chrome.extension.sendMessage({
      type: _ACTION.START_SCRAP,
      ...data,
    });
  });

  $('#upload-now').on('click', function(e) {
    if (!confirm('Are you sure to upload all products?')) return false;
    const data = {};
    chrome.extension.sendMessage({
      type: _ACTION.UPLOAD_PRODUCT,
      ...data,
    });
  });
});

function fillStartScrapForm() {
  return _MEMORY.loadSettings()
    .then(settings => {
      const iSettings = new AppConfig(settings);
      console.log('[Setting]', iSettings);
      $('#max-tabs').val(iSettings.maxTabs);
      $('#base-id').val(iSettings.airtable.currentBase);
    })
    .catch(error => {
      console.log('[settings] error: ', error);
      toastr.error('Error while loading settings!', 'Setting');
    });
}

function validateStartAction() {
  const baseId = $('#base-id').val();
  const maxTabs = $('#max-tabs').val();
  let valid = true;
  if (!baseId) {
    valid = false;
    toastr.error('Please enter Airtable base ID!');
  }
  if (!maxTabs) {
    valid = false;
    toastr.error('Please enter the max tabs to open!');
  }
  return valid ? { baseId, maxTabs } : false;
}

function startSraping() {

}

function stopScraping() {

}