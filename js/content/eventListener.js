let lock = false;
window.addEventListener('message', function (event) {
  const action = event.data.action;
  if (action == 'CONTENT_SCRIPT_COMMAND') {
    if (!lock) {
      lock = true;
      const command = event.data.command;
      switch (command) {
        case "RELOAD_PAGE":
          const homeLinkEl = document.querySelector(".logo-link");
          const route = homeLinkEl.getAttribute('href');
          window.next.router.push({
            pathname: route,
          }, undefined, { shallow: true })
          event.preventDefault();
          event.stopPropagation();
          break;

        default:
          break;
      }
    }
  }
});