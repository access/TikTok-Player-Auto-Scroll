let lock = false;
window.addEventListener('message', function (event) {
  const action = event.data.action;
  if (action == 'CONTENT_SCRIPT_COMMAND') {
    const command = event.data.command;
    switch (command) {
      case "RELOAD_PAGE":
        if (!lock) {
          lock = true;
          nextLoadRoute('/embed');
        }
        break;
      case "RELOAD_PAGE_READY":
        if (lock)
          nextLoadRoute('/trending');
        break;
    }
  }
});

function nextLoadRoute(route) {
  window.next.router.push({
    pathname: route,
  }, undefined, { shallow: true });
}

const onDocumentFullLoad = function () {
  const eventSubscribe = function () {
    if (typeof window.next.router !== "undefined")
      window.next.router.events.on('routeChangeComplete', (url) => {
        if (url === '/trending')
          lock = false;
      });
    else
      setTimeout(() => {
        eventSubscribe();
      }, 500);
  }
  eventSubscribe();
};

if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) {
  onDocumentFullLoad();
} else {
  document.addEventListener("DOMContentLoaded", onDocumentFullLoad);
}