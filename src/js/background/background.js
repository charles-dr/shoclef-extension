let _tabs = {};
var appData;
console.log('[Background] Loaded');

loadData();

chrome.extension.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {
  console.log('[Data] Requested')
  const { type } = request;
  // console.log('[message]', request, sender);
  if (type === "requestData") {
    sendResponse(appData);
  }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  const { oldValue, newValue } = changes.data;
  console.log('[Data][Updated]', newValue);
  appData = newValue;
});

function loadData() {
  chrome.storage.local.get(['data'], function (store = {}) {
    const { data } = store;
    appData = data;
    console.log('[Cache][Data]', appData);
  });
}