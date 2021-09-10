const btnAutoPlay = document.getElementById("btnAutoPlay");
const btnPausePlay = document.getElementById("btnPausePlay");
const btnStopPlay = document.getElementById("btnStopPlay");
const chkFullScreen = document.getElementById("chkFullScreen");
const btnPrevPlay = document.getElementById("btnPrevPlay");
const btnNextPlay = document.getElementById("btnNextPlay");
const chkVideoInfoBar = document.getElementById("chkVideoInfoBar");

let globalOptions = {
  playerStarted: false,
  isFullScreen: false,
  playerPaused: false
};

const onDocumentFullLoad = async () => {
  await getAllOptions(async (options) => {
    globalOptions = await options;

    $(chkFullScreen).prop('checked', options.isFullScreen);
    $(chkVideoInfoBar).prop('checked', options.hideVideoInfoBar);

    switch (options.playerPaused) {
      case true:
        $(btnAutoPlay).removeClass('btn-success').addClass('btn-outline-success');
        $(btnStopPlay).removeClass('btn-danger').addClass('btn-outline-danger');
        $(btnPausePlay).removeClass('btn-outline-primary').addClass('btn-primary');
        break;
    }

    switch (options.playerStarted) {
      case true:
        $(btnPausePlay).removeClass('btn-primary').addClass('btn-outline-primary');
        $(btnStopPlay).removeClass('btn-danger').addClass('btn-outline-danger');
        $(btnAutoPlay).removeClass('btn-outline-success').addClass('btn-success');
        break;
      case false:
        //$(btnPausePlay).removeClass('btn-outline-primary').addClass('btn-primary');
        $(btnAutoPlay).removeClass('btn-success').addClass('btn-outline-success');
        if (!options.playerPaused)
          $(btnStopPlay).removeClass('btn-outline-danger').addClass('btn-danger');
        break;
    }

  });
};

if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) {
  onDocumentFullLoad();
} else {
  document.addEventListener("DOMContentLoaded", onDocumentFullLoad);
}

btnAutoPlay.addEventListener("click", async () => {
  await setOption("playerStarted", true);
  await setOption("playerPaused", false);
  $(btnAutoPlay).addClass('btn-success').removeClass('btn-outline-success');
  $(btnStopPlay).addClass('btn-outline-danger').removeClass('btn-danger');
  $(btnPausePlay).removeClass('btn-primary').addClass('btn-outline-primary');

  await getAllOptions(async (options) => {
    globalOptions = options;
    await sendCmd("START_PLAY");
  });
});

chkFullScreen.addEventListener("change", async () => {
  await setOption("isFullScreen", ($(chkFullScreen).is(":checked")) ? true : false);
});

chkVideoInfoBar.addEventListener("change", async () => {
  await setOption("hideVideoInfoBar", ($(chkVideoInfoBar).is(":checked")) ? true : false);
});

btnPausePlay.addEventListener("click", async () => {
  await sendCmd("PAUSE_PLAY");
  await setOption("playerPaused", true);
  await setOption("playerStarted", false);
  await setOption("playlistFinished", false);

  $(btnPausePlay).addClass('btn-primary').removeClass('btn-outline-primary');
  $(btnAutoPlay).addClass('btn-outline-success').removeClass('btn-success');
  $(btnStopPlay).addClass('btn-outline-danger').removeClass('btn-danger');
});

btnStopPlay.addEventListener("click", async () => {
  await sendCmd("STOP_PLAY");
  await setOption("playerStarted", false);
  await setOption("playlistFinished", false);
  await setOption("settedFullscreen", false);
  await setOption("playerPaused", false);

  $(btnPausePlay).removeClass('btn-primary').addClass('btn-outline-primary');
  $(btnAutoPlay).addClass('btn-outline-success').removeClass('btn-success');
  $(btnStopPlay).addClass('btn-danger').removeClass('btn-outline-danger');
});

btnPrevPlay.addEventListener("click", async () => {
  await sendCmd("PREV_PLAY");
});

btnNextPlay.addEventListener("click", async () => {
  await sendCmd("NEXT_PLAY");
});

function sendCmd(cmd) {
  try {
    let querying = chrome.tabs.query({ active: true }); //({ currentWindow: true, active: true });
    querying.then(function (tab) {
      for (const openTab of tab) {
        if (openTab.url.toLowerCase().includes("tiktok.com")) {
          chrome.tabs.sendMessage(openTab.id, { action: cmd, options: globalOptions }, function (response) { });
        }
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
