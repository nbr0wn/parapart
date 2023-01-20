
export function writeStateInFragment(state) {
  console.log('WRITING STATE IN FRAGMENT' + JSON.stringify(state));
  if(typeof state === "object" && state.id > 0 && state.changed == true ) {
    window.location.hash = encodeURIComponent(JSON.stringify(state));
  }
  else {
    window.location.hash = encodeURIComponent(state.id);
  }
}
export function readStateFromFragment() {
  if (window.location.hash.startsWith('#') && window.location.hash.length > 1) {
    try {
      let state = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
      if( typeof state != 'object' ) {
        let val = parseInt(state);
        if( isNaN(val) ) {
          val = 0;
        }
        state = {
          part :{
            id: val,
            configurator: { },
            changed: false,
          },
          source: {
            name: '',
            content: '',
          },
        };
      }
      console.log("STATE FROM URI: " + JSON.stringify(state));
      return state;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  return null;
}

export function copyURIToClipboard() {
  // Clipboard + toast handler for share link
  console.log("Get part link clicked " + window.location.hash);

  let toast = document.getElementById("toasty");
  if (toast) {
    document.getElementById("main-page").removeChild(toast);
  }

  toast = document.createElement("div");
  toast.id = "toasty";
  toast.classList.add("toast");
  toast.classList.add("toast-bottom");
  toast.classList.add("transition-opacity");
  let alert = document.createElement("div");
  alert.classList.add("alert");
  alert.classList.add("alert-info");

  let msg = document.createElement("div");
  let span = document.createElement("span");

  console.log(JSON.stringify(window.location));
  navigator.clipboard.writeText(window.location.href).then(() => {
    span.innerText = "Copied!";
  }, (err) => { span.innerText = "Clipboard Copy Failed"; });

  msg.appendChild(span);
  alert.appendChild(msg);
  toast.appendChild(alert);
  document.getElementById("main-page").appendChild(toast);

  setTimeout(function () {
    let toast = document.getElementById("toasty");
    if (toast) {
      document.getElementById("main-page").removeChild(toast);
    }
  }, 1000);
}