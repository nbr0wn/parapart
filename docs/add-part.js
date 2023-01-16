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
        // Raw SCAD
        if(scadText.value.trim().length == 0)
        {
            // No raw SCAD
            console.log("RAW SCAD BUT NO TXT");
        } else {
            // TODO - check it
            activateSubmitButton(true);
            return;
        }
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

// TODO - replace this with a DB query
var SECTIONS = [
[ "1110", "Four Sided Containers"],
[ "1120", "Containers with >4 Sides"],
[ "1200", "Trays"],
[ "1300", "Holders"],
[ "2100", "Hooks"],
[ "3100", "Nuts"],
[ "3200", "Bolts"],
[ "3300", "Washers"],
[ "3400", "Screws"],
[ "4000", "Standoffs"],
[ "5000", "Hinges"],
[ "5100", "Pin Barrel Hinges"],
[ "6000", "Gears"],
[ "7000", "Wheels"],
[ "8100", "Motion"],
[ "8110", "Linear Slides"],
[ "8120", "Bushings"],
[ "8130", "Couplers"],
[ "9100", "8020 Extrusion Components"],
[ "9200", "Bar Stock"],
[ "9300", "Blocks"],
[ "9400", "Wedges"],
[ "10100", "Fans"],
[ "10200", "Motors"],
[ "10300", "Displays"],
[ "10400", "Power Supplies"],
[ "10500", "Switches"],
[ "10600", "Potentiometers"],
[ "10700", "Connectors"],
[ "12000", "Tools"],
[ "11000", "Miscellaneous"]];

function add_part_section_option(section_id,name) {
  let opt = document.createElement("option");
  opt.value = section_id;
  opt.text = name;
  document.getElementById("part-section").appendChild(opt);
}

export function setupAddPart() {
    // Close the gallery view on add part.  Could NOT figure out how
    // to have the modal pop over the gallery overlay.  Grr.
    document.getElementById("add-part-btn").onclick = function() { 

        // Clear contents and error conditions
        partName.value = "";
        partSection.value = "0";
        githubURL.value = ""; rawCheck.checked = false;
        scadText.value = "";
        document.getElementById('github-fields').style.display = "block";
        document.getElementById('non-github-file').style.display = "none";

        // Close gallery
        document.getElementById("nav-overlay").style.width = "0vw";
    }

    // TODO - Fill in options with a query from the database instead 
    SECTIONS.map((section) => { add_part_section_option(section[0],section[1]); });

    // Handle the checkbox functionality
    document.getElementById("add-part-form").onchange = () => { 
        if (rawCheck.checked) {
            document.getElementById('github-fields').style.display = "none";
            document.getElementById('non-github-file').style.display = "block";
        } else {
            document.getElementById('github-fields').style.display = "block";
            document.getElementById('non-github-file').style.display = "none";
        }
        canSubmit();
    }

    partName.oninput = (event) => { canSubmit(); }
    partSection.onchange = (event) => { canSubmit(); }
    githubURL.oninput = (event) => { canSubmit(); }
    rawCheck.onchange = (event) => { canSubmit(); }
    // Why do I need all these?
    scadText.oninput = (event) => { canSubmit(); }


    document.getElementById("add-part-confirm").onclick = function() { 
        if (submitButton.classList.contains("btn-disabled")) {
            return;
        }
        let TEXT = "NAME~=~" + partName.value + "\n";
        TEXT +="SECTION~=~" + partSection.value + "\n";
        if(rawCheck.checked ) {
            TEXT += "SCAD~=~\n```" + scadText.value + "\n```";
        }
        else {
            TEXT += "URL~=~" + githubURL.value + "\n";
        }
        let uriTxt = encodeURIComponent(TEXT);
        window.location.assign('https://github.com/nbr0wn/parapart/issues/new?title=SCAD&body='+uriTxt);
    }
}
