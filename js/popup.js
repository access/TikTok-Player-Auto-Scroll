const btnAutoPlay = document.getElementById("btnAutoPlay");
const btnPausePlay = document.getElementById("btnPausePlay");
const btnStopPlay = document.getElementById("btnStopPlay");
const chkFullScreen = document.getElementById("chkFullScreen");
const btnPrevPlay = document.getElementById("btnPrevPlay");
const btnNextPlay = document.getElementById("btnNextPlay");

let globalOptions = {
  playerStarted: false,
  isFullScreen: false,
  playerPaused: false
};

const onDocumentFullLoad = function () {
  getAllOptions(function (options) {
    globalOptions = options;
    $(chkFullScreen).prop('checked', options.isFullScreen);
    if (options.playerStarted) {
      $(btnAutoPlay).addClass('btn-success').removeClass('btn-outline-success');
    } else {
      $(btnStopPlay).addClass('btn-danger').removeClass('btn-outline-danger');
    }
  });
};

if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) {
  onDocumentFullLoad();
} else {
  document.addEventListener("DOMContentLoaded", onDocumentFullLoad);
}

btnAutoPlay.addEventListener("click", function () {
  setOption("playerStarted", true);
  $(btnAutoPlay).addClass('btn-success').removeClass('btn-outline-success');
  $(btnStopPlay).addClass('btn-outline-danger').removeClass('btn-danger');

  getAllOptions(function (options) {
    globalOptions = options;
    sendCmd("START_PLAY");
  });
});

chkFullScreen.addEventListener("change", async () => {
  setOption("isFullScreen", ($(chkFullScreen).is(":checked")) ? true : false);
});

btnPausePlay.addEventListener("click", async () => {
  sendCmd("PAUSE_PLAY");
});

btnStopPlay.addEventListener("click", async () => {
  sendCmd("STOP_PLAY");
  setOption("playerStarted", false);
  setOption("playlistFinished", false);
  setOption("settedFullscreen", false);

  $(btnAutoPlay).addClass('btn-outline-success').removeClass('btn-success');
  $(btnStopPlay).addClass('btn-danger').removeClass('btn-outline-danger');

});

btnPrevPlay.addEventListener("click", async () => {
  sendCmd("PREV_PLAY");
});

btnNextPlay.addEventListener("click", async () => {
  sendCmd("NEXT_PLAY");
});

function sendCmd(cmd) {
  try {
    let querying = chrome.tabs.query({ currentWindow: true, active: true });
    querying.then(function (tab) {
      if (tab[0].url.toLowerCase().includes("tiktok")) {
        chrome.tabs.sendMessage(tab[0].id, { action: cmd, options: globalOptions }, function (response) { });
      }
    }, function () { });
  } catch (e) { }
}

function setOption(option, value) {
  let obj = {};
  obj["action"] = "OPTION_SET";
  obj["option"] = option;
  obj["value"] = value;
  chrome.runtime.sendMessage(obj, function (response) { });
}

function getOption(option, callback) {
  let obj = {};
  obj["action"] = "OPTION_GET";
  obj["option"] = option;

  try {
    chrome.runtime.sendMessage(obj, function (response) {
      callback(response);
    });
  } catch (error) { }
}

function getAllOptions(callback) {
  chrome.runtime.sendMessage({ action: "OPTIONS_ALL_GET" }, function (response, result) {
    callback(response);
  });
}
