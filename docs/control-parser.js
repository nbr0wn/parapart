import { log, warn, error } from './log.js';

// Generate a random string for our unique identifiers
function randomString() { 
    var d = new Date().getTime();
    var d2 = ((typeof performance !== 'undefined') 
        && performance.now 
        && (performance.now()*1000)) || 0;
    return 'xxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;
        if(d > 0){
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// Build up the customization array for the scad controls
async function updateCustomizations(varname, value) {
    //log(`Setting ${varname} to ${value}`);
    globalThis.parapart.part.customization[varname] = value;
    globalThis.parapart.part.changed = true;
}

// Add a control label
function addLabel(controlDiv, description, varname) {
    if(description == "") {
        description = varname;
    }
    let label = document.createElement("h3");
    label.innerHTML = description;
    document.getElementById(controlDiv).appendChild(label);
}

function addSlider(controlDiv,description,varname,value,rangeList) {
    var uniqueTag=randomString();

    addLabel(controlDiv,description,varname);

    // Create the range label
    let rangeTxt = document.createElement("h4");
    rangeTxt.classList.add("range-text")

    // Create the slider itself
    let slider = document.createElement("input");
    slider.type = "range";
    slider.id=`slider-${uniqueTag}`;
    slider.classList.add("slider");
    slider.value = value;

    // Create the matching text input box
    let sliderInput = document.createElement("input");
    sliderInput.type = "number";
    sliderInput.id=`sliderTxt-${uniqueTag}`;
    sliderInput.classList.add("slidertext");
    sliderInput.value = value;

    if( rangeList.length == 1 ) {
        // We only have a max value
        slider.min = 0;
        slider.max = rangeList[0];
        rangeTxt.innerHTML = `MAX: ${rangeList[0]}`;
        sliderInput.min = 0;
        sliderInput.max = rangeList[0];
    } else if (rangeList.length == 2) {
        // Just min and max
        slider.min = rangeList[0];
        slider.max = rangeList[1];
        rangeTxt.innerHTML = `[${rangeList[0]} - ${rangeList[1]}]`;
        sliderInput.min = rangeList[0];
        sliderInput.max = rangeList[1];
    } else {
        // Min, step, max
        slider.min = rangeList[0];
        slider.step = rangeList[1];
        slider.max = rangeList[2];
        rangeTxt.innerHTML = `[${rangeList[0]} - ${rangeList[2]}]`;
        sliderInput.min = rangeList[0];
        sliderInput.step = rangeList[1];
        sliderInput.max = rangeList[2];
    }

    // Add the range text label
    document.getElementById(controlDiv).appendChild(rangeTxt);

    // Add the slider
    let form = document.createElement("form");
    form.onsubmit=function() { }
    form.setAttribute("onchange", `updateSliderTxt('${uniqueTag}', '${varname}');`);
    form.appendChild(slider);
    document.getElementById(controlDiv).appendChild(form);

    // Add the matching text input box
    form = document.createElement("form");
    form.setAttribute("onchange", `moveSliderThumb('${uniqueTag}', '${varname}',
        '${slider.min}', '${slider.max}');`);
    form.appendChild(sliderInput);
    document.getElementById(controlDiv).appendChild(form);

    updateCustomizations(varname,value);
}

function addCheckbox(controlDiv, description, varname, value ) {
    const uniqueTag=randomString();
    addLabel(controlDiv,description,varname);

    let form = document.createElement("form");
    form.onsubmit=function() { }
    form.setAttribute("onchange", `updateCheckBox('${uniqueTag}', '${varname}');`);
    let checkBox = document.createElement("input");
    checkBox.type = "checkbox";
    checkBox.id = `check-${uniqueTag}`;
    checkBox.value = value;
    if(value == "true" ) {
        checkBox.checked = true;
    }
    form.appendChild(checkBox)
    document.getElementById(controlDiv).appendChild(form);

    updateCustomizations(varname,value);
}

function addTextBox(controlDiv, description, varname, value ) {
    const uniqueTag=randomString();
    addLabel(controlDiv,description,varname);
    
    let form = document.createElement("form");
    form.onsubmit=function() { }
    form.setAttribute("onchange", `updateTextBox('${uniqueTag}', '${varname}');`);
    form.onsubmit=function() { }
    let textBox = document.createElement("input");
    textBox.type = "text";
    textBox.id = `text-${uniqueTag}`;
    textBox.value = value;
    form.appendChild(textBox)
    document.getElementById(controlDiv).appendChild(form);

    updateCustomizations(varname,value);
}

function addSpinBox(controlDiv, description, varname, value ) {
    const uniqueTag=randomString();
    addLabel(controlDiv,description,varname);
    
    let form = document.createElement("form");
    form.onsubmit=function() { }
    form.setAttribute("onchange", `updateSpinBox('${uniqueTag}', '${varname}');`);
    let spinBox = document.createElement("input");
    spinBox.type = "number";
    spinBox.id = `spin-${uniqueTag}`;
    spinBox.value = value;
    form.appendChild(spinBox)
    document.getElementById(controlDiv).appendChild(form);
    
    updateCustomizations(varname,value);
}


function addVector(controlDiv, description, varname, elementList, rangeList) {
    const uniqueTag=randomString();
    addLabel(controlDiv,description,varname);
    
    let form = document.createElement("form");
    form.onsubmit=function() { }
    form.setAttribute("onchange", `updateVector('${uniqueTag}', '${varname}');`);

    elementList.forEach((entry) => {
        let vec = document.createElement("input");
        vec.type = "number";
        vec.id = `vector-${uniqueTag}`;
        vec.value = `${entry}`;
        if(rangeList.length > 0) {
            vec.min = rangeList[0];
            vec.max = rangeList[2];
            vec.step = rangeList[1];
        }
        form.appendChild(vec);
    });
    document.getElementById(controlDiv).appendChild(form);

    updateCustomizations(varname,"["+elementList.toString()+"]");
}

function addComboBox(controlDiv,description,varname,defaultValue,optionList) {
    const uniqueTag=randomString();
    addLabel(controlDiv,description,varname);

    // Create the form
    let form = document.createElement("form");
    form.onsubmit=function() { }
    form.setAttribute("onchange", `updateComboBox('${uniqueTag}', '${varname}');`);
    // Create the select element
    let sel = document.createElement("select");
    sel.id=`combo-${uniqueTag}`;
    // Add it to the form
    form.appendChild(sel);

    // Split the options on commas
    optionList.forEach((entry) => {
        // Do we have labeled entries?
        let option = document.createElement("option");
        if(entry.includes(":") )
        {
            console.log(entry);
            // Yes - Value:Label
            let labelval = entry.split(":");
            option.value = labelval[0];
            option.innerHTML = labelval[1];
        } else {
            // No, just raw values
            option.value = entry;
            option.innerHTML = entry;
        }

        if(option.value == defaultValue) {
            option.selected = true;
        }
        // Add this option to the form
        sel.appendChild(option);
    });
    
    // Add form to document
    document.getElementById(controlDiv).appendChild(form);
    updateCustomizations(varname,defaultValue);
}

function makeTabActive(tabId) {
    // Remove tab-active from all tabs
    const tabList = document.getElementsByClassName("tab");
    for( let i = 0; i < tabList.length; i++) {
        tabList[i].classList.remove("tab-active");
        document.getElementById(tabList[i].id+'-div').style.display="none";
    }
    // Add tab-active to this tab
    document.getElementById(tabId).classList.add("tab-active");
    document.getElementById(tabId + '-div').style.display = "block";
}


function addTab(tabName) {
    let randomStr = randomString();
    let tabId = "tab-" + randomStr;

    let anchor = document.createElement("a");
    anchor.classList.add("removable");
    anchor.classList.add("tab");
    anchor.classList.add("tab-lifted");
    anchor.id = tabId;
    anchor.text = tabName;
    anchor.onclick = function () { makeTabActive(tabId); }

    let newDiv = document.createElement("div");
    newDiv.id = "tabdiv-" + randomStr;
    newDiv.classList.add("removable");
    newDiv.classList.add("tab-content");
    newDiv.id = tabId + '-div';

    // Append this div to the control area
    let editor = document.getElementById("tabhelp");
    document.getElementById("tab-head").insertBefore(anchor,editor);
    document.getElementById("control-area").appendChild(newDiv);
    
    // Return the new control area ID
    return randomStr;
}

function cleanupControls() {
    // Nuke all the removable stuff
    const removeList = document.getElementsByClassName("removable");
    while( removeList.length > 0 ) {
        removeList[0].parentNode.removeChild(removeList[0]);
    }
}

function addHelpLine(line){
    const help = document.getElementById('tabhelp-contents');
    const tn = document.createTextNode(line + "\n");
    help.appendChild(tn);
}


// /* [Drop down box:] */
// // combo box for number
// Numbers=2; // [0, 1, 2, 3]
// 
// // combo box for string
// Strings="foo"; // [foo, bar, baz]
// 
// //labeled combo box for numbers
// Labeled_values=10; // [10:L, 20:M, 30:XL]
// 
// //labeled combo box for string
// Labeled_value="S"; // [S:Small, M:Medium, L:Large]
// 
// /*[ Slider ]*/
// // slider widget for number
// slider =34; // [10:100]
// 
// //step slider for number
// stepSlider=2; //[0:5:100]
// 
// /* [Checkbox] */
// 
// //description
// Variable = true;
// 
// /*[Spinbox] */
// 
// // spinbox with step size 1
// Spinbox = 5; 
// 
// /* [Textbox] */
// 
// //Text box for vector with more than 4 elements
// Vector6=[12,34,44,43,23,23];
// 
// // Text box for string
// String="hello";
// 
// /* [Special vector] */
// //Text box for vector with less than or equal to 4 elements
// Vector1=[12]; //[0:2:50]
// Vector2=[12,34]; //[0:2:50]
// Vector3=[12,34,46]; //[0:2:50]
// Vector4=[12,34,46,24]; //[0:2:50]

const tabRegex = /^\/\*\s*\[\s*(?<tab>.+)\s*\*\//; // /* [Tab name:] */
const descriptionRegex = /^\s*\/\/\s*(?<description>[\w ]+.*)\s*$/; // // Control Description
const vectorRegex = /^\s*(?<varname>[\w]+)\s*=\s*\[\s*(?<elements>[\d,\.\- ]+)\s*\]\s*;/; // // Variable = 10;
const numberRegex = /^\s*(?<varname>[\w]+)\s*=\s*(?<value>[\d.+-]+)\s*;/; // // Variable = 10;
const boolRegex = /^\s*(?<varname>[\w]+)\s*=\s*(?<value>true|false)\s*;/; // // Variable = "foo";
const stringRegex = /^\s*(?<varname>[\w]+)\s*=\s*"(?<value>[^"]+)"\s*;/; // // Variable = "foo";
const sliderRange = /\/\/\s*\[(?<options>[\d: ]+)\]/; // // [1, 2, 3];
const comboList = /\/\/\s*\[(?<options>.+)\]/; // // [1, 2, 3];
const customizationEndRegex = /\s*module\s+\w+\s*\(/; // module some_string (...
const header1Regex = /^\s*\/\/\s*ADDED BY/; // Autogen header
const header2Regex = /^\s*\/\/\s*ADD DATE/; // Autogen header
const header3Regex = /^\s*include\s*</; // Autogen header
const header4Regex = /^\s*use\s*</; // Autogen header

export function buildCustomizer(data) {
    var haveTabs = false;
    var description;

    cleanupControls();
    
    log("** Parsing Customizer Fields")
    globalThis.parapart.part.customization = { };

    // Activate the static tabs
    document.getElementById('tabedit').onclick = function () { makeTabActive('tabedit'); }
    document.getElementById('tabsettings').onclick = function () { makeTabActive('tabsettings'); }
    document.getElementById('tablogs').onclick = function () { makeTabActive('tablogs'); }
    document.getElementById('tabhelp').onclick = function () { makeTabActive('tabhelp'); }

    // Add the first tab
    let tabId = addTab('Customization')
    var controlLabelId = 'tab-' + tabId;
    var controlDiv = 'tab-' + tabId + '-div';

    // Make the first tab active
    document.getElementById('tab-'+tabId).classList.add("tab-active");
    document.getElementById(controlDiv).style.display = "block";

    data.toString().split("\n").every( function(line, index, arr) {

        log(index + " " + line);

        // END OF CUSTOMIZATION MARKER
        if(line.match(customizationEndRegex)) {
            //log("CUSTOMIZATION END: " + line );
            // All done
            return false;
        }

        // Early stuff to just skip
        if(line.match(header1Regex)
            || line.match(header2Regex)
            || line.match(header3Regex)
            || line.match(header4Regex)) {
            // Skip these
            return true;
        }

        addHelpLine(line);

        // DESCRIPTIONS
        // We want this first so that we can break early to avoid
        // resetting the description at the end of the loop
        let matches;
        if( matches = line.match(descriptionRegex)) {
            description = matches.groups.description;
            log("DESCRIPTION: " + description );
            //addHelpLine(`** ${description}`);
            return true;
        }

        // TABS
        if( matches = line.match(tabRegex)) {
            let tabName = matches.groups.tab.replaceAll("[","").replaceAll("]","");
            log(`TAB: ${tabName}`);
            //addHelpLine(`\n-- SECTION ${tabName} --\n`);
            // If this is the first tab, rename our default placeholder 
            // rather than creating a new one
            if( haveTabs == false ){
                // Relabel the default tab
                document.getElementById(controlLabelId).innerHTML = tabName;
                haveTabs = true;
            } else {
                // Create a new tab
                controlDiv = 'tab-' + addTab(tabName) + '-div';
            }
        }

        // STRINGS
        if( matches = line.match(stringRegex)) {
            let varname = matches.groups.varname;
            let value = matches.groups.value;
            log(`STRING: ${varname} = ${value}` );
            if( matches = line.match(comboList)) {
                // String combo box (labeled and not)
                let optionList = matches.groups.options.split(',').map( element => {
                    return element.trim();
                });
                log(`STRING OPTIONS: ${optionList}` );
                addComboBox(controlDiv,description,varname,value,optionList);
            } else {
                // Plain string text box
                addTextBox(controlDiv,description,varname,value);
            }
        }

        // NUMBERS
        if( matches = line.match(numberRegex)) {
            let varname = matches.groups.varname;
            let value = matches.groups.value;
            log(`NUMBER: ${varname} = ${value}` );
            if( line.includes(",")) {
                // Combo Box for numbers (labeled and not)
                let matches = line.match(comboList);
                let optionList = matches.groups.options.split(',').map( element => {
                    return element.trim();
                });
                log(`NUMBER OPTIONS: ${optionList}` );
                addComboBox(controlDiv,description,varname,value,optionList);
            } else if( matches = line.match(sliderRange)) {
                // Slider with range (optional step)
                let rangeList = matches.groups.options.split(':').map( element => {
                    return element.trim();
                });
                addSlider(controlDiv,description,varname,value,rangeList);
                log(`NUMBER SLIDER RANGE: ${rangeList}` );
            } else {
                // Plain number spinbox
                addSpinBox(controlDiv, description, varname, value);
            }
        }

        // BOOLEANS
        if( matches = line.match(boolRegex)) {
            // Checkbox
            let varname = matches.groups.varname;
            let value = matches.groups.value;
            log(`BOOL: ${varname} = ${value}` );
            addCheckbox(controlDiv, description, varname, value);
        }

        // VECTORS
        if( matches = line.match(vectorRegex)) {
            let varname = matches.groups.varname;
            let elements = matches.groups.elements;
            log(`VECTOR: ${varname} = ${elements}` );
            let elementList = elements.split(',').map( element => {
                return element.trim();
            });
            log(`VECTOR ELEMENTS: ${elementList}` );
            if(line.includes(":")) {
                let rangeList;
                // Vector with ranges
                if( matches = line.match(sliderRange)) {
                    // Range list
                    rangeList = matches.groups.options.split(':').map( element => {
                        return element.trim();
                    });
                    log(`VECTOR RANGE: ${rangeList}` );
                }
                addVector(controlDiv, description, varname, elementList, rangeList);
            } else {
                // Plain vector text box
                addVector(controlDiv, description, varname, elementList, []);
            }
        }

        // Reset description
        description = "";

        // Process next line
        return true;
    });
}
