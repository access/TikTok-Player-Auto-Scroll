const btnAutoPlay = document.getElementById("btnAutoPlay");
const btnPausePlay = document.getElementById("btnPausePlay");
const btnStopPlay = document.getElementById("btnStopPlay");
const chkFullScreen = document.getElementById("chkFullScreen");
const btnPrevPlay = document.getElementById("btnPrevPlay");
const btnNextPlay = document.getElementById("btnNextPlay");
const chkVideoInfoBar = document.getElementById("chkVideoInfoBar");
const btnClosePopup = document.getElementById("btnClosePopup");
const progressVideo = document.getElementById("progressVideo");
const btnMute = document.getElementById("btnMute");
const btnMuteIcon = document.getElementById("btnMuteIcon");
const volumeRange = document.getElementById("volumeRange");

let globalOptions = {
  playerStarted: false,
  playerIsFullScreen: true,
  hideVideoInfoBar: true,
  playerPaused: false,
  playlistFinished: false,
  videoOptionDefaultMuted: true,
  videoOptionMuted: true,
  videoVolume: 0
};

const onDocumentFullLoad = async () => {
  // check open tabs with tiktok, if not exists - force stop player
  const querying = chrome.tabs.query({}); //({ currentWindow: true, active: true });
  await querying.then(async (tab) => {
    let hasTabTikTok = false;
    for await (const openTab of tab)
      if (openTab.url.toLowerCase().includes("tiktok.com"))
        hasTabTikTok = true;
    if (!hasTabTikTok) {
      await setOption("playerPaused", false);
      await setOption("playerStarted", false);
      await setOption("playlistFinished", false);
    }
  }, () => { });

  $('input, button').on('focus', function () {
    const activeEl = $(this).get(0);
    activeEl.blur();
  });

  // start init
  await getAllOptions(async (options) => {
    globalOptions = await options;

    $(chkFullScreen).prop('checked', options.playerIsFullScreen);
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
        $(btnAutoPlay).removeClass('btn-success').addClass('btn-outline-success');
        if (!options.playerPaused)
          $(btnStopPlay).removeClass('btn-outline-danger').addClass('btn-danger');
        break;
    }

    switch (options.videoOptionMuted) {
      case true:
        $(btnMuteIcon).removeClass('bi-volume-up').addClass('bi-volume-mute');
        break;
      case false:
        $(btnMuteIcon).removeClass('bi-volume-mute').addClass('bi-volume-up');
        break;
    }

    $(volumeRange).val(options.videoVolume);


  });
};

if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) {
  onDocumentFullLoad();
} else {
  document.addEventListener("DOMContentLoaded", onDocumentFullLoad);
}

$(volumeRange).on('change', function () {
  const volume = $(this).val();
  globalOptions.videoVolume = volume;
  sendCmd("OPTIONS_VIDEO_VOLUME");
});

btnMute.addEventListener("click", async () => {
  await getAllOptions(async (options) => {
    switch (await options.videoOptionMuted) {
      case false:
        $(btnMuteIcon).removeClass('bi-volume-up').addClass('bi-volume-mute');
        await setOption("videoOptionMuted", true);
        globalOptions.videoOptionMuted = true;
        break;
      case true:
        $(btnMuteIcon).removeClass('bi-volume-mute').addClass('bi-volume-up');
        await setOption("videoOptionMuted", false);
        globalOptions.videoOptionMuted = false;
        break;
    }
    await sendCmd("OPTIONS_VIDEO_MUTE");
  });
});

btnAutoPlay.addEventListener("click", async () => {
  await _PLAY();
});

chkFullScreen.addEventListener("change", async () => {
  const val = ($(chkFullScreen).is(":checked")) ? true : false;
  globalOptions.playerIsFullScreen = val;
  await setOption("playerIsFullScreen", val);
  await sendCmd('SET_FULLSCREEN_MODE');
});

chkVideoInfoBar.addEventListener("change", async () => {
  const val = ($(chkVideoInfoBar).is(":checked")) ? true : false;
  globalOptions.hideVideoInfoBar = val;
  await setOption("hideVideoInfoBar", val);
  await sendCmd('HIDE_VIDEO_INFOBAR');
});

btnPausePlay.addEventListener("click", async () => {
  await _PAUSE();
});

btnStopPlay.addEventListener("click", async () => {
  await _STOP();
});

btnPrevPlay.addEventListener("click", async () => {
  await sendCmd("PREV_PLAY");
});

btnNextPlay.addEventListener("click", async () => {
  await sendCmd("NEXT_PLAY");
});

btnClosePopup.addEventListener("click", async () => {
  window.close();
});

async function sendCmd(cmd) {
  try {
    //let querying = chrome.tabs.query({ active: true }); //({ currentWindow: true, active: true });
    let querying = chrome.tabs.query({}); //({ currentWindow: true, active: true });
    await querying.then(async (tab) => {
      for await (const openTab of tab) {
        if (openTab.url.toLowerCase().includes("tiktok.com")) {
          await chrome.tabs.sendMessage(openTab.id, { action: cmd, options: globalOptions }, function (response) { });
        }
      }
    }, function () { });
  } catch (e) { }
}

async function setOption(option, value) {
  let obj = {};
  obj["action"] = "OPTION_SET";
  obj["option"] = option;
  obj["value"] = value;
  await chrome.runtime.sendMessage(obj, async (response) => {
    const res = await response;
    if (chrome.runtime.lastError) {
      return;
    }

  });
}

function getOption(option, callback) {
  let obj = {};
  obj["action"] = "OPTION_GET";
  obj["option"] = option;

  try {
    chrome.runtime.sendMessage(obj, function (response) {
      if (chrome.runtime.lastError) {
        return;
      }

      callback(response);
    });
  } catch (error) { }
}

async function getAllOptions(callback) {
  await chrome.runtime.sendMessage({ action: "OPTIONS_ALL_GET" }, async (response, result) => {
    if (chrome.runtime.lastError) {
      return;
    }

    callback(await response);
  });
}

document.addEventListener('keyup', async function (e) {
  // console.log(` ${e.code}`, e);

  await getAllOptions(async (options) => {
    globalOptions = await options;
    const isPlaying = options.playerStarted;
    const isPaused = options.playerPaused;
    const isInfoBarHidden = options.hideVideoInfoBar;
    const isFullScreen = options.playerIsFullScreen;

    if (e.key == ' ') {
      if (!isPlaying || isPaused) {
        _PLAY();
      }
      else
        _PAUSE();
    }

    if (e.key == 'Control') {
      await _SHOW_HIDE_VIDEO_INFOBAR(!isInfoBarHidden);
    }

    if (e.key == 'f') {
      await _SWITCH_FULLSCREEN(!isFullScreen);
    }

    if (e.key == 'ArrowRight' || e.key == 'ArrowDown') {
      await sendCmd("NEXT_PLAY");
    }

    if (e.key == 'ArrowLeft' || e.key == 'ArrowUp') {
      await sendCmd("PREV_PLAY");
    }

  });
});

async function _PLAY() {
  globalOptions.playerStarted = true;
  await setOption("playerStarted", true);
  await setOption("playerPaused", false);
  await sendCmd("START_PLAY");
  $(btnAutoPlay).addClass('btn-success').removeClass('btn-outline-success');
  $(btnStopPlay).addClass('btn-outline-danger').removeClass('btn-danger');
  $(btnPausePlay).removeClass('btn-primary').addClass('btn-outline-primary');
  $(progressVideo).addClass('progress-bar-animated');
}

async function _PAUSE() {
  await sendCmd("PAUSE_PLAY");
  await setOption("playerPaused", true);
  await setOption("playerStarted", false);
  await setOption("playlistFinished", false);

  $(btnPausePlay).addClass('btn-primary').removeClass('btn-outline-primary');
  $(btnAutoPlay).addClass('btn-outline-success').removeClass('btn-success');
  $(btnStopPlay).addClass('btn-outline-danger').removeClass('btn-danger');
  $(progressVideo).removeClass('progress-bar-animated');
}

async function _STOP() {
  await sendCmd("STOP_PLAY");
  await setOption("playerStarted", false);
  await setOption("playlistFinished", false);
  await setOption("playerPaused", false);

  $(btnPausePlay).removeClass('btn-primary').addClass('btn-outline-primary');
  $(btnAutoPlay).addClass('btn-outline-success').removeClass('btn-success');
  $(btnStopPlay).addClass('btn-danger').removeClass('btn-outline-danger');
  $(progressVideo).removeClass('progress-bar-animated');
}

async function _SHOW_HIDE_VIDEO_INFOBAR(val) {
  globalOptions.hideVideoInfoBar = val;
  await setOption("hideVideoInfoBar", val);
  await sendCmd('HIDE_VIDEO_INFOBAR');
  $(chkVideoInfoBar).prop('checked', val);
}

async function _SWITCH_FULLSCREEN(val) {
  globalOptions.playerIsFullScreen = val;
  $(chkFullScreen).prop('checked', val);
  await setOption("playerIsFullScreen", val);
  await sendCmd('SET_FULLSCREEN_MODE');
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action) {
    switch (message.action) {
      case "VIDEO_PROGRESS":
        const video = message.video;
        /*
            const videoAttr = {
              duration: event.target.duration,
              currentTime: event.target.currentTime
            };
        */
        // aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"
        const percent = video.currentTime / (video.duration / 100);
        progressVideo.setAttribute('aria-valuemax', video.duration);
        progressVideo.setAttribute('aria-valuenow', video.currentTime);
        progressVideo.style.width = percent + '%';
        break;

      default:
        break;
    }
  }
  return true;
});
