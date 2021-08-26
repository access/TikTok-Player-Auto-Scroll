const options = {
  playerStarted: false,
  isFullScreen: true,
  playerPaused: false,
  playlistFinished: false,
  settedFullscreen:false
};

chrome.runtime.onInstalled.addListener(() => {
  initOptions();
});

chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
  let action = message.action;

  switch (action) {
    case "OPTION_GET":
      sendResponse(options[message.option], false);
      break;

    case "OPTION_SET":
      dbSaveOption(message.option, message.value, function () {
        options[message.option] = message.value;
        sendResponse(options);
      });
      break;

    case "OPTIONS_ALL_GET":
      sendResponse(options);
      break;
      
    default:
      break;
  }
  return true;
});

function initOptions() {
  for (const [key, value] of Object.entries(options)) {
    dbGetOption(key, function (res) {
      if (res[key]) { options[key] = res[key];}
    });
  }
}

function dbGetOption(key, callback) {
  chrome.storage.sync.get(key, function (result) {
    callback(result);
  });
}

function dbSaveOption(key, value, callback) {
  let obj = {};
  obj[key] = value;
  chrome.storage.sync.set(obj, function () {
    if (typeof callback === "function") {
      callback(key, value);
    }
  });
}

//-------------------------------------- keep alive service --------------------------------------

let lifeline;
keepAlive();

chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'keepAlive') {
    lifeline = port;
    setTimeout(keepAliveForced, 295e3); 
    port.onDisconnect.addListener(keepAliveForced);
  }
});

function keepAliveForced() {
  lifeline?.disconnect();
  lifeline = null;
  keepAlive();
}

async function keepAlive() {
  if (lifeline) return;
  for (const tab of await chrome.tabs.query({ url: '*://*/*' })) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => chrome.runtime.connect({ name: 'keepAlive' }),
      });
      chrome.tabs.onUpdated.removeListener(retryOnTabUpdate);
      return;
    } catch (e) {}
  }
  chrome.tabs.onUpdated.addListener(retryOnTabUpdate);
}

async function retryOnTabUpdate(tabId, info, tab) {
  if (info.url && /^(file|https?):/.test(info.url)) {
    keepAlive();
  }
}