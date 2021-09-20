const options = {
  playerStarted: false,
  playerIsFullScreen: true,
  hideVideoInfoBar: true,
  playerPaused: false,
  playlistFinished: false,
  videoOptionDefaultMuted: true,
  videoOptionMuted: true,
  videoVolume: 0
};

chrome.runtime.onInstalled.addListener(() => {
  initAllOptions().then(async () => {
    await dbSaveOption("playerPaused", false);
    await dbSaveOption("playerStarted", false);
    await dbSaveOption("playlistFinished", false);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let action = message.action;
  switch (action) {
    case "OPTION_GET":
      sendResponse(options[message.option], false);
      break;

    case "OPTION_SET":
      dbSaveOption(message.option, message.value)
        .then((res) => { sendResponse(options); });
      break;

    case "OPTIONS_ALL_GET":
      // fixed bad reads data fro storage without keep-alive service worker
      initAllOptions().then(() => {
        sendResponse(options);
      });
      break;

    default:
      sendResponse("piingggg");
      break;
  }
  return true;
});

function initAllOptions() {
  let promiseArr = [];
  for (const [key, value] of Object.entries(options)) {
    const promise = new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError)
          reject(chrome.runtime.lastError, value);
        resolve(result);
      });
    });
    promiseArr.push(promise);
  }

  return Promise.all(promiseArr).then(values => {
    values.forEach(val => {
      for (const [key, value] of Object.entries(val)) {
        options[key] = value;
      }
    });
  });
}

async function dbSaveOption(key, value, callback) {
  let obj = {};
  obj[key] = value;

  await chrome.storage.local.set(obj, async (res) => {
    options[key] = value;
    if (typeof callback === "function") {
      callback(key, value);
    }
  });
}