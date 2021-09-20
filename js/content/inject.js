console.log("TikTok Player connected.");
let video = null, videoEventElement = null, videoInfoBar = null, nowIsFullScreen = false;



const onDocumentFullLoad = function () {
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL("/js/content/eventListener.js");
  (document.head || document.documentElement).appendChild(s);

  nowIsFullScreen = document.fullscreen;


  $.initialize("#nprogress", function () {
    video.pause();
    $('video').each(function () {
      $(this).get(0).pause();
    })

    const nextPageProgressElement = $(this).get(0);
    $(nextPageProgressElement).on("DOMNodeRemoved", function (e) {
      $(this).off("DOMNodeRemoved", function (e) { });
      setTimeout(() => {
        getAllOptions(async (options) => {
          if (options.playlistFinished) {
            window.postMessage({
              action: 'CONTENT_SCRIPT_COMMAND',
              command: 'RELOAD_PAGE_READY'
            },
              '*');
            setOption('playlistFinished', false)
          }
        });
      }, 1000);
      $('video').each(function () {
        $(this).get(0).pause();
      })
    });
  });

  $.initialize(".login-frame-container", function () {
    const loginFrame = $(this).get(0);
    getAllOptions(async (options) => {
      if (options.playerStarted) {
        $(loginFrame).remove();
      }
    });
  });

  $.initialize("._embed_error_wrapper ", function () {
    getAllOptions(async (options) => {
      if (options.playerStarted) {
        $('._embed_error_title').html("Video is loading");
        $('._embed_error_sub-title').html("Please wait...");
        $('._embed_error_button-link').remove();
      }
    });
    $('video').each(function () {
      $(this).get(0).pause();
    })
  });

  $.initialize(".video-card-big > .content-container", function () {
    videoInfoBar = $(this).get(0);
    getAllOptions(async (options) => {
      if (options.hideVideoInfoBar)
        $(videoInfoBar).hide();
      else
        $(videoInfoBar).show();
    });
  });

  $.initialize("video", function () {
    video = $(this).get(0);
    videoEventElement = $(video).parent().find('.event-delegate-mask').get(0);

    video.addEventListener("volumechange", async (e) => {
      await setOption("videoOptionDefaultMuted", video.videoOptionDefaultMuted);
      await setOption("videoOptionMuted", video.muted);
      const appVol = JSON.parse(localStorage.getItem('webapp-video-mute'));
      if (appVol != undefined && appVol != null) {
        e.target.volume = appVol.volume;
        e.target.muted = appVol.muted;
      }
      localStorage.setItem('webapp-video-mute', JSON.stringify(appVol));
      await setOption("videoVolume", video.volume);
    });

    video.addEventListener("playing", async (event) => {
      getAllOptions(async (options) => {
        if (options.playerPaused)
          video.pause();
      });
    });

    video.addEventListener("timeupdate", async (event) => {
      const videoAttr = {
        duration: event.target.duration,
        currentTime: event.target.currentTime
      };
      chrome.runtime.sendMessage({ action: "VIDEO_PROGRESS", video: videoAttr }, function (response, result) {
      });
    });

    video.addEventListener("canplay", async () => {
      let decPortion = (video.duration.toFixed(3) + "").split(".")[1];
      let msw = parseInt(video.duration) * 1000 + parseInt(decPortion);
      let hasNext = $(".arrow-right").length;

      getAllOptions(async (options) => {
        if (options.playerStarted) {
          video.loop = false;
          playAuto(options);
          video.addEventListener("ended", async () => {
            this.removeEventListener("ended", () => { });
            this.removeEventListener("timeupdate", () => { });
            this.removeEventListener("canplay", () => { });
            if (!hasNext) {
              $('.video-card-container > .control-icon.close').click();
              $('.lazyload-wrapper').remove();
              setOption('playlistFinished', true);
              window.postMessage({
                action: 'CONTENT_SCRIPT_COMMAND',
                command: 'RELOAD_PAGE'
              },
                '*');
            } else {
              $(".arrow-right").click();
            }
          });
        }
      });
    });
  });
};

document.addEventListener('fullscreenchange', function (e) {
  nowIsFullScreen = document.fullscreen;
}, false);

function playAuto(options) {
  video.play();
  if (options.playerIsFullScreen && options.playerStarted) {
    setTimeout(() => {
      const browseMode = $('.video-card-big.browse-mode').length;
      if (!browseMode)
        $(videoEventElement).click();
    }, 500);
  }

  try {
    if (!nowIsFullScreen && options.playerIsFullScreen && options.playerStarted) {
      document.documentElement.requestFullscreen().then(() => { }).catch(() => { });
    }
  } catch (error) { }
}

async function setOption(option, value) {
  let obj = {};
  obj["action"] = "OPTION_SET";
  obj["option"] = option;
  obj["value"] = value;
  await chrome.runtime.sendMessage(obj, async (response) => { await response });
}

function getAllOptions(callback) {
  chrome.runtime.sendMessage({ action: "OPTIONS_ALL_GET" }, function (response, result) {
    callback(response);
  });
}

document.addEventListener('keyup', async function (e) {
  await getAllOptions(async (options) => {
    const _options = await options;
    const isPlaying = options.playerStarted;
    const isPaused = options.playerPaused;
    const isInfoBarHidden = options.hideVideoInfoBar;

    if (e.key == ' ') {
      if (!isPlaying || isPaused)
        await _PLAY(options);
      else if (options.playerIsFullScreen)
        await _PAUSE();
    }
    if (e.key == 'Control') {
      await _SHOW_HIDE_VIDEO_INFOBAR(isInfoBarHidden);
    }
    if (e.key == 'Escape') {
      await _STOP();
    }

    if (e.key == 'f') {
      options.playerIsFullScreen = !options.playerIsFullScreen;
      await _SWITCH_FULLSCREEN(options, true);
    }

    if (e.key == 'ArrowRight') {
      $(".arrow-right").click();
    }

    if (e.key == 'ArrowLeft') {
      $(".arrow-left").click();
    }

  });
});

async function _PLAY(options) {
  await setOption('playerPaused', false)
  await setOption('playerStarted', true)
  playAuto(options);
}

async function _PAUSE() {
  await setOption('playerStarted', false)
  await setOption('playerPaused', true);
  video.pause();
  $('video').each(function () {
    $(this).get(0).pause();
  })
  $(video).siblings().find('.event-delegate-mask').click();
}

async function _STOP() {
  await setOption('playerStarted', false)
  await setOption('playerPaused', false);
  $(".close").click();
  video.pause();
  $('video').each(function () {
    this.pause();
  });
  if (nowIsFullScreen)
    document.exitFullscreen();
}

async function _SHOW_HIDE_VIDEO_INFOBAR(val) {
  await setOption('hideVideoInfoBar', !val)
  if (!val)
    $(videoInfoBar).hide();
  else
    $(videoInfoBar).show();
}

async function _SWITCH_FULLSCREEN(options, saveState = false) {
  if (saveState)
    await setOption('playerIsFullScreen', options.playerIsFullScreen);
  if (options.playerIsFullScreen && options.playerStarted) {
    playAuto(options);
  }
  else {
    $('.control-icon.close').click();
    if (nowIsFullScreen)
      document.exitFullscreen();
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action) {
    switch (message.action) {
      case "START_PLAY":
        _PLAY(message.options);
        sendResponse({});
        break;

      case "PAUSE_PLAY":
        _PAUSE(message.options);
        sendResponse({});
        break;

      case "STOP_PLAY":
        _STOP();
        sendResponse({});
        break;

      case "PREV_PLAY":
        $(".arrow-left").click();
        sendResponse({});
        break;

      case "NEXT_PLAY":
        $(".arrow-right").click();
        sendResponse({});
        break;

      case "HIDE_VIDEO_INFOBAR":
        if (message.options.hideVideoInfoBar)
          $(videoInfoBar).hide();
        else
          $(videoInfoBar).show();
        sendResponse({});
        break;

      case "SET_FULLSCREEN_MODE":
        _SWITCH_FULLSCREEN(message.options);
        sendResponse({});
        break;

      case "OPTIONS_VIDEO_MUTE":
        sendResponse(document);
        const appMuted = JSON.parse(localStorage.getItem('webapp-video-mute'));
        appMuted.muted = message.options.videoOptionMuted;
        localStorage.setItem('webapp-video-mute', JSON.stringify(appMuted));
        video.muted = message.options.videoOptionMuted;
        break;

      case "OPTIONS_VIDEO_VOLUME":
        sendResponse(document);
        const vol = message.options.videoVolume;
        video.volume = vol;
        video.setAttribute("volume", vol);
        const appVol = JSON.parse(localStorage.getItem('webapp-video-mute'));
        appVol.volume = vol;
        localStorage.setItem('webapp-video-mute', JSON.stringify(appVol));
        break;
    }
  }
  return true;
});

if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) {
  onDocumentFullLoad();
} else {
  document.addEventListener("DOMContentLoaded", onDocumentFullLoad);
}