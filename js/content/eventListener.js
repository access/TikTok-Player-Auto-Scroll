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

          // var request = new XMLHttpRequest();
          // request.onreadystatechange = function () {
          //   if (request.readyState < 4) {
          //     return;
          //   }
          //   if (request.status !== 200) {
          //     return;
          //   }
          //   if (request.readyState === 4) {
          //     successCallback();
          //   }
          // };
          // request.open('GET', route, true);
          // request.send('');
          // successCallback = function () {
          //   //document.innerHTML = request.responseText;
          //   //history.pushState('', '', "?" + container + "=" + source);

          //   let doc = document.implementation.createHTMLDocument("");
          //   doc.open();
          //   doc.write(request.responseText);
          //   doc.close();

          //   document.head.innerHTML = doc.head.innerHTML;
          //   document.body.innerHTML = doc.body.innerHTML;
          //   document.title = doc.title;

          //   const nextURL = route;
          //   const nextTitle = doc.title;
          //   const nextState = { additionalInformation: '...' };
          //   window.history.pushState(nextState, nextTitle, nextURL);
          //   window.history.replaceState(nextState, nextTitle, nextURL);

          //   console.log('request.responseText: ', doc);
          // }



          break;

        default:
          break;
      }
    }
  }
});