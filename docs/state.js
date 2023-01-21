
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

export function writePartToURL(changed,part) {
  console.log('WRITING PART TO URL:' + JSON.stringify(part));
  // Save any customizations
  if(changed && ! isEmpty(part.customization) ) {
    window.location.hash = encodeURIComponent(JSON.stringify(part));
  } else {
    // Otherwise just save the part ID
    window.location.hash = part.id;
  }
}

const defaultPart = {
  id: 0,
  customization: { },
};

export function readPartFromURL() {
  let newPart = defaultPart;
  let changed = false;
  if (window.location.hash.startsWith('#') && window.location.hash.length > 1) {
    try {
      let URLPart = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
      // If it's not an object, it may just be a part ID
      if( typeof URLPart != 'object' ) {
        let val = parseInt(URLPart);
        if( ! isNaN(val) ) {
          newPart.id = val;
        }
      } else {
        // Save the ID and the customization settings
        newPart.id = URLPart.id;
        newPart.customization = URLPart.customization;
        changed = true;
      }
    } catch (e) {
      console.error(e);
    }
  } 
  writePartToURL(changed,newPart);
  return newPart;
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