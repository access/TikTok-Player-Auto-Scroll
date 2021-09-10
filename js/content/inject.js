console.log("TikTok Player connected.");
let video = null, videoEventElement = null, videoInfoBar = null, nowIsFullScreen = false;
const onDocumentFullLoad = function () {
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL("/js/content/eventListener.js");
  (document.head || document.documentElement).appendChild(s);

  nowIsFullScreen = document.fullscreen;
  setOption('settedFullscreen', nowIsFullScreen);
  $.initialize(".content-container", function () {
    videoInfoBar = $(this);
    getAllOptions(function (options) {
      if (options.hideVideoInfoBar)
        $(videoInfoBar).hide();
      else
        $(videoInfoBar).show();
    });
  });

  $.initialize("video", function () {
    video = $(this).get(0);
    videoEventElement = $(video).parent().find('.event-delegate-mask').get(0);
    video.removeEventListener("canplay", function () { });
    video.addEventListener("canplay", function () {
      let decPortion = (video.duration.toFixed(3) + "").split(".")[1];
      let msw = parseInt(video.duration) * 1000 + parseInt(decPortion);

      const secondsToHms = (secs) => {
        var sec_num = parseInt(secs, 10)
        var hours = Math.floor(sec_num / 3600)
        var minutes = Math.floor(sec_num / 60) % 60
        var seconds = sec_num % 60

        return [hours, minutes, seconds]
          .map(v => v < 10 ? "0" + v : v)
          .filter((v, i) => v !== "00" || i > 0)
          .join(":")
      }

      console.log("Video time: ", secondsToHms(msw / 1000));
      let hasNext = $(".arrow-right").length;

      getAllOptions(function (options) {
        if (options.playerStarted) {
          video.loop = false;
          if (options.playlistFinished) {
            $(videoEventElement).click();
            setOption('playlistFinished', false)
          }
          video.addEventListener("ended", function () {
            this.removeEventListener("ended", async (e) => { });
            if (!hasNext) {
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
  setOption('settedFullscreen', document.fullscreen);
}, false);

function playAuto(options) {
  $(videoEventElement).click();
}

function setOption(option, value) {
  let obj = {};
  obj["action"] = "OPTION_SET";
  obj["option"] = option;
  obj["value"] = value;
  chrome.runtime.sendMessage(obj, function (response) { });
}

function getAllOptions(callback) {
  chrome.runtime.sendMessage({ action: "OPTIONS_ALL_GET" }, function (response, result) {
    //console.log('response: ', response);
    callback(response);
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  //console.log('onMessage.addListener: ', message);
  if (message.action) {
    switch (message.action) {
      case "START_PLAY":
        playAuto(message.options);
        sendResponse(document);
        break;

      case "PAUSE_PLAY":
        sendResponse(document);
        video.pause();
        break;

      case "STOP_PLAY":
        sendResponse(document);
        video.pause();
        $(".close").click();
        break;

      case "PREV_PLAY":
        sendResponse(document);
        $(".arrow-left").click();
        break;

      case "NEXT_PLAY":
        sendResponse(document);
        $(".arrow-right").click();
        break;

      default:
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