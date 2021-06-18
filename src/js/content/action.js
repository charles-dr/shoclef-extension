var scanner;
var stat = {
  total: 0,
  roomMsg: 0,
  members: 0,
  initialized: false,
};
var discordWebhook =
  "https://discord.com/api/webhooks/837812705514749963/AY62TnOMoQ4Gk8rA56HV2SAXmhFImjPY1yDR8uuE-QOhw-Qo2lkayepxXoNHoGuNpUky";

$(function () {
  console.log("[Script][Action] Loaded", typeof startScan);

  chrome.extension.sendMessage({ type: "requestData" }, function (data) {
    discordWebhook = data.discordWebhook;
    
    startScan();
  });

  addEventListeners();
  
});

function addEventListeners() {
  window.addEventListener("popstate", function (event) {
    console.log("[Action][Listener] Url changed");
    clearInterval(scanner);
    initStats();
    startScan();
  });
}

function startScan() {
  const msgList = document.querySelectorAll(
    ".webcast-chatroom-messages-list.is-not-lock"
  );
  if (msgList.length > 0) {
    console.log('[Action][Scan] starting...')
    scanner = setInterval(batchScan, 500);
  } else {
    // console.log("[No Live Chat] iterating...");
    setTimeout(startScan, 200);
  }
}

async function batchScan() {
  try {
    const nTotal = document.querySelectorAll(".webcast-chatroom-message-item")
      .length;
    const nRoom = document.querySelectorAll(
      ".webcast-chatroom-message-item.webcast-chatroom__chat-message"
    ).length;
    const members = (
      document.querySelector(".webcast-chatroom-header-person-number") || {}
    ).innerText;

    // console.log('[Action][Batch]', stat.roomMsg, nRoom)
    if (stat.roomMsg < nRoom) {
      for (let i = stat.roomMsg; i < nRoom; i++) {
        const message = document.querySelectorAll(".webcast-chatroom-message-item.webcast-chatroom__chat-message")[i];
        if (!message) {
          console.log("[Action][No message for index]");
          continue;
        }
        const username =
          (
            message.querySelector(
              ".chat-message-item .webcast-chatroom__profile_wrapper .nickname"
            ) || {}
          ).innerText || "UNKNOWN";
        const content = (
          message.querySelector(".chat-message-item .content") || {}
        ).innerText;
        const avatar = message
          .querySelector(".badge-image img")
          .getAttribute("src");

        if (content) {
          notifyDiscord(username, content, avatar);
        }
      }
    }
    // update stats
    stat = {
      total: nTotal,
      roomMsg: nRoom,
      members,
      initialized: false,
    };
  } catch (e) {
    console.log("[Action][Error]", e);
    notifyError(e.message);
  }
}

function initStats() {
  stat = {
    total: 0,
    roomMsg: 0,
    members: 0,
    initialized: false,
  };
}

function notifySuccess(message) {
  console.log("[Success]", message);
}

function notifyError(message) {
  console.log("[Error]", message);
}

function notifyDiscord(username, message, avatar) {
  return axios({
    baseURL: discordWebhook,
    url: '/api/message',
    method: 'post',
    data: {
      username,
      content: message,
      message,
      avatar,
    },
  });
}
