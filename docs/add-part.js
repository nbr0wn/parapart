
// Handlers for the "ADD A PART" UI

import { log, warn, error } from './log.js';


const submitButton = document.getElementById("add-confirm-btn");
const partName = document.getElementById("part-name");
const partSection = document.getElementById("part-section");
const githubURL = document.getElementById("github-url");
const rawCheck = document.getElementById("raw-scad");
const scadText = document.getElementById("scad-text");

function activateSubmitButton(active) {
    if(active) {
        submitButton.classList.remove("btn-disabled");
    } else {
        submitButton.classList.add("btn-disabled");
    }
}

const isValidUrl = urlString=> {
    var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
  '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
return !!urlPattern.test(urlString);
}

function canSubmit() {
    // Need a name
    if( partName.value.length == 0 )
    {
        console.log("PART NAME NULL");
        activateSubmitButton(false);
        return;
    }
    // Need a section
    if( partSection.value == "0" )
    {
        console.log("NO SECTION");
        activateSubmitButton(false);
        return;
    }

    // Are we doing a URL or raw SCAD?
    if (rawCheck.checked) {
        // TODO - check it
        activateSubmitButton(true);
        return;
    } else {
        // Raw SCAD
        let url = githubURL.value;
        if(url.length == 0)
        {
            // No Github URL
            console.log("NO URL");
        } else {
            // URL - check it
            if(isValidUrl(url)){
                let re1 = /#.*/;
                let re2 = /[?].*/;
                let fields=url.trim().replace(re1,'').replace(re2, '').split('/');
                // Looks good
                if((fields[2] == "github.com" || fields[2] == "raw.githubusercontent.com" )
                && fields.length >= 7 )
                {
                    activateSubmitButton(true);
                    return;
                }
            }
            // It's crap.
        }
    }
    activateSubmitButton(false);
}


function add_part_section_option(section_id,name) {
  let opt = document.createElement("option");
  opt.value = section_id;
  opt.text = name;
  document.getElementById("part-section").appendChild(opt);
}

export function setupAddPart(partList) {
    // Close the gallery view on add part.  Could NOT figure out how
    // to have the modal pop over the gallery overlay.  Grr.
    document.getElementById("add-part-btn").onclick = function() { 

        // Clear contents and error conditions
        partName.value = "";
        partSection.value = "0";
        githubURL.value = ""; rawCheck.checked = false;
        document.getElementById('github-fields').style.display = "block";

        // Close gallery
        document.getElementById("nav-overlay").style.width = "0vw";
    }

    // TODO - Fill in options with a query from the database instead 
    partList.map((section) => { add_part_section_option(section[0],section[1]); });

    // Handle the checkbox functionality
    document.getElementById("add-part-form").onchange = () => { 
        if (rawCheck.checked) {
            document.getElementById('github-fields').style.display = "none";
        } else {
            document.getElementById('github-fields').style.display = "block";
        }
        canSubmit();
    }

    partName.oninput = (event) => { canSubmit(); }
    partSection.onchange = (event) => { canSubmit(); }
    githubURL.oninput = (event) => { canSubmit(); }
    rawCheck.onchange = (event) => { canSubmit(); }


    document.getElementById("add-part-confirm").onclick = function() { 
        if (submitButton.classList.contains("btn-disabled")) {
            return;
        }
        let TEXT = "NAME::" + partName.value + "\n";
        TEXT +="SECTION::" + partSection.value + "\n";
        if(rawCheck.checked ) {
            TEXT += "SCAD::\n```\n\n\n\n         [PASTE YOUR OPENSCAD SCRIPT HERE]\n\n\n\n```";
        }
        else {
            TEXT += "URL::" + githubURL.value + "\n";
        }
        let uriTxt = encodeURIComponent(TEXT);
        window.location.assign('https://github.com/nbr0wn/parapart/issues/new?title=SCAD&body='+uriTxt);
    }
}
