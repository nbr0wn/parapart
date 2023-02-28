import { createWasmMemory, spawnOpenSCAD } from './openscad-runner.js'
import { registerOpenSCADLanguage } from './openscad-editor-config.js'
import { readPartFromURL, writePartToURL, copyURIToClipboard } from './state.js'
import { buildFeatureCheckboxes } from './features.js';
import { buildCustomizer } from './control-parser.js';
import { buildGallery, loadDatabase, buildSearchResults, buildSection, editPart, getStyle } from './gallery.js';
import { log, warn, error } from './log.js';


const editorElement = document.getElementById('monacoEditor');
const runButton = document.getElementById('re-render');
const killButton = document.getElementById('stop-render');
const renderStatusElement = document.getElementById('render-status');
const linkContainerElement = document.getElementById('download');
const autorenderCheckbox = document.getElementById('autorender');
const autoparseCheckbox = document.getElementById('autoparse');
const autorotateCheckbox = document.getElementById('autorotate');
// const showedgesCheckbox = document.getElementById('showedges');
const showExperimentalFeaturesCheckbox = document.getElementById('show-experimental');
const stlViewerElement = document.getElementById("viewer");
const showLogsElement = document.getElementById("show-logs");
const showEditorElement = document.getElementById("show-editor");
const featuresContainer = document.getElementById("features");
const flipModeButton = document.getElementById("flip-mode");
const searchBox = document.getElementById("part-search");
// const maximumMegabytesInput = document.getElementById("maximum-megabytes");
// const copyLinkButton = document.getElementById("copy-link");


const parapart_assets = "https://raw.githubusercontent.com/nbr0wn/parapart/docs/assets";

const darkButton = document.getElementById('darkmode');
const lightButton = document.getElementById('lightmode');

var modelColor;
var renderFailed = true;
var currentPartId = 0;
var sourceFileName;
var editor;

// Flag for the first time after loading a page
var initialLoad = true;

const featureCheckboxes = {};

//var defaultCamState = { position: { x: -100, y: 0, z: 100 }, up: { x: 0, y: 1, z: 0 }, target: { x: 0, y: 0, z: 0 } };
var savedCamState = null;

var stlViewer;
var stlFile;

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

function rgba2hex(orig) {
  var a, isPercent,
  rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
  alpha = (rgb && rgb[4] || "").trim(),
  hex = rgb ?
  (rgb[1] | 1 << 8).toString(16).slice(1) +
  (rgb[2] | 1 << 8).toString(16).slice(1) +
  (rgb[3] | 1 << 8).toString(16).slice(1) : orig;

  //if (alpha !== "") { a = alpha; }
  //else { a = ''; } // No alpha channel
  //hex = hex + a;

  return hex;
}

//const rgba2hex = (rgba) => `#${rgba.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.{0,1}\d*))?\)$/).slice(1).map((n, i) => (i === 3 ? Math.round(parseFloat(n) * 255) : parseFloat(n)).toString(16).padStart(2, '0').replace('NaN', '')).join('')}`

function buildStlViewer() {
  const stlViewer = new StlViewer(stlViewerElement, {});
  stlViewer.set_center_models(true);
  //stlViewer.set_auto_resize(true);
  stlViewer.set_auto_zoom(true);
  //stlViewer.set_zoom(-1);
  stlViewer.set_drag_and_drop(false);
  stlViewer.set_grid(false);
  stlViewer.set_bg_color('transparent');
  stlViewer.model_loaded_callback = id => {
    if ( savedCamState != null ) {
      stlViewer.set_camera_state(savedCamState);
    }
  };
  return stlViewer;
}

function viewStlFile() {
  try {
  //console.log(stlViewer.get_camera_state());
  //stlViewer.set_camera_state({ position: { x: -100, y: 0, z: 100 }, up: { x: 0, y: 1, z: 0 }, target: { x: 0, y: 0, z: 0 } })
    stlViewer.clean();
    stlViewer.zoom_done = false;
    stlViewer.add_model({ id: 1, local_file: stlFile, color: modelColor });
    //console.log(stlViewer);
  } catch (e) { console.log("STLVIEW ERROR: " + e); }
}

function addDownloadLink(container, blob, fileName) {
  container.onclick = function downloadFile() {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
  };
}

function formatMillis(n) {
  let seconds = Math.floor(n / 1000);
  let ms = Math.floor(n % 1000).toString().padStart(3,'0');
  return `${seconds}.${ms} seconds`;
}

//////////////////////////////////////////////////////////////////////
// Handle draggable width DIV
//////////////////////////////////////////////////////////////////////
let lastXPos = 0;
let leftWidth = 0;

const resizer = document.getElementById('resizer');
const leftSide = document.getElementById('control-area');
const rightSide = document.getElementById('view-panel');

const mouseMoveHandler = function(e) {
   // How far the mouse has been moved
   const dx = e.clientX - lastXPos;

   const newLeftWidth = ((leftWidth + dx) * 100) / resizer.parentNode.getBoundingClientRect().width;
   // Account for the divider
   const newRightWidth = 98 - newLeftWidth;
   leftSide.style.width = `${newLeftWidth}%`;
   rightSide.style.width = `${newRightWidth}%`;
};

const mouseUpHandler = function () {
  // Remove the handlers of `mousemove` and `mouseup`
  document.removeEventListener('mousemove', mouseMoveHandler);
  document.removeEventListener('mouseup', mouseUpHandler);
};
// Handle the mousedown event
// that's triggered when user drags the resizer
const mouseDownHandler = function (e) {
    // Get the current mouse position
    lastXPos = e.clientX;
    leftWidth = leftSide.getBoundingClientRect().width;

    // Attach the listeners to `document`
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
};

// Attach the handler to the draggable div
resizer.onmousedown = mouseDownHandler;

//////////////////////////////////////////////////////////////////////
// Handle OpenSCAD tasks
//////////////////////////////////////////////////////////////////////

let lastJob;

killButton.onclick = () => {
  if (lastJob) {
    lastJob.kill();
    lastJob = null;
  }
};

function setAutoRotate(value) {
  autorotateCheckbox.checked = value;
  stlViewer.set_auto_rotate(value);
}

function setViewerFocused(value) {
  if (value) {
    flipModeButton.innerText = 'Edit ✍️';
    stlViewerElement.classList.add('focused');
  } else {
    flipModeButton.innerText = 'Interact 🤏';
    stlViewerElement.classList.remove('focused');
  }
}

function isViewerFocused() {
  return stlViewerElement.classList.contains('focused');
}

function setExecuting(isExecuting) {
  if (isExecuting) {
    renderStatusElement.innerText = 'rendering...1%';
    renderStatusElement.title = null;
    linkContainerElement.classList.add("btn-disabled");
    killButton.classList.remove("btn-disabled");
    runButton.classList.add("btn-disabled");
  } else {
    if (renderFailed == false) {
      linkContainerElement.classList.remove("btn-disabled");
    }
    killButton.classList.add("btn-disabled");
    runButton.classList.remove("btn-disabled");
  }
}

var lastProcessedOutputsTimestamp;

function processMergedOutputs(editor, mergedOutputs, timestamp) {
  if (lastProcessedOutputsTimestamp != null && timestamp < lastProcessedOutputsTimestamp) {
    // We have slow (render) and fast (syntax check) runs running concurrently.
    // The results of slow runs might be out of date now.
    return;
  }
  lastProcessedOutputsTimestamp = timestamp;

  let unmatchedLines = [];
  let allLines = [];

  const markers = [];
  let warningCount = 0, errorCount = 0;
  const addError = (error, file, line) => {
    markers.push({
      startLineNumber: Number(line),
      startColumn: 1,
      endLineNumber: Number(line),
      endColumn: 1000,
      message: error,
      severity: monaco.MarkerSeverity.Error
    })
  }
  for (const { stderr, stdout, error } of mergedOutputs) {
    allLines.push(stderr ?? stdout ?? `EXCEPTION: ${error}`);
    if (stderr) {
      if (stderr.startsWith('ERROR:')) errorCount++;
      if (stderr.startsWith('WARNING:')) warningCount++;

      let m = /^ERROR: Parser error in file "([^"]+)", line (\d+): (.*)$/.exec(stderr)
      if (m) {
        const [_, file, line, error] = m
        addError(error, file, line);
        continue;
      }

      m = /^ERROR: Parser error: (.*?) in file ([^",]+), line (\d+)$/.exec(stderr)
      if (m) {
        const [_, error, file, line] = m
        addError(error, file, line);
        continue;
      }

      m = /^WARNING: (.*?),? in file ([^,]+), line (\d+)\.?/.exec(stderr);
      if (m) {
        const [_, warning, file, line] = m
        markers.push({
          startLineNumber: Number(line),
          startColumn: 1,
          endLineNumber: Number(line),
          endColumn: 1000,
          message: warning,
          severity: monaco.MarkerSeverity.Warning
        })
        continue;
      }
    }
    unmatchedLines.push(stderr ?? stdout ?? `EXCEPTION: ${error}`);
  }
  if (errorCount || warningCount) unmatchedLines = [`${errorCount} errors, ${warningCount} warnings!`, '', ...unmatchedLines];
  log("** OPENSCAD RENDER OUTPUT");
  log(allLines.join('\n'));

  monaco.editor.setModelMarkers(editor.getModel(), 'openscad', markers);
}

const syntaxDelay = 300;
const checkSyntax = turnIntoDelayableExecution(syntaxDelay, () => {
  const source = editor.getValue();
  const timestamp = Date.now();

  const job = spawnOpenSCAD({
    inputs: [['input.scad', source + '\n']],
    args: ["input.scad", "-o", "out.ast"],
  });

  return {
    kill: () => job.kill(),
    completion: (async () => {
      try {
        const result = await job;
        //console.log(result);
        processMergedOutputs(editor, result.mergedOutputs, timestamp);
      } catch (e) {
        console.error(e);
      }
    })()
  };
});

function turnIntoDelayableExecution(delay, createJob) {
  var pendingId;
  var runningJobKillSignal;

  const doExecute = async () => {
    if (runningJobKillSignal) {
      runningJobKillSignal();
      runningJobKillSignal = null;
    }
    const { kill, completion } = createJob();
    runningJobKillSignal = kill;
    try {
      await completion;
    } finally {
      runningJobKillSignal = null;
    }
  }
  return async ({ now }) => {
    if (pendingId) {
      clearTimeout(pendingId);
      pendingId = null;
    }
    if (now) {
      doExecute();
    } else {
      pendingId = setTimeout(doExecute, delay);
    }
  };
}

var renderDelay = 1000;
const render = turnIntoDelayableExecution(renderDelay, () => {
  const source = editor.getValue();
  const timestamp = Date.now();

  setExecuting(true);

  renderFailed = false;

  // Rejigger the customization parameters into the format that openscad wants
  let customization = { 
    "parameterSets" : { 
      "first": globalThis.parapart.part.customization 
    }
  };

  console.log("CUSTOMIZER JSON: " + JSON.stringify(customization));

  const job = spawnOpenSCAD({
    // wasmMemory,
    inputs: [
      ['input.scad', source],
      ['customizations.json', JSON.stringify(customization)]
    ],
    args: [
      //"--debug", "all",
      "--summary", "all",
      "-p", "customizations.json",
      "-P", "first",
      "-o", "out.stl",
      "input.scad",
      ...Object.keys(featureCheckboxes).filter(f => featureCheckboxes[f].checked).map(f => `--enable=${f}`),
    ],
    outputPaths: ['out.stl']
  });

  return {
    kill: () => job.kill(),
    completion: (async () => {
      try {
        const result = await job;
        console.log(result);
        processMergedOutputs(editor, result.mergedOutputs, timestamp);

        if (result.error) {
          throw result.error;
        }

        renderStatusElement.innerText = "Render time: " + formatMillis(result.elapsedMillis);

        const [output] = result.outputs;
        if (!output) throw 'No output from runner!'
        const [filePath, content] = output;
        const filePathFragments = filePath.split('/');
        const fileName = filePathFragments[filePathFragments.length - 1];

        // TODO: have the runner accept and return files.
        const blob = new Blob([content], { type: "application/octet-stream" });
        // console.log(new TextDecoder().decode(content));
        stlFile = new File([blob], fileName);

        savedCamState = stlViewer.get_camera_state();

        viewStlFile(stlFile);

        addDownloadLink(linkContainerElement, blob, fileName);
      } catch (e) {
        console.error(e, e.stack);
        renderStatusElement.innerText = '[Render Failed]';
        renderFailed = true;
        linkContainerElement.classList.add("btn-disabled");
        //renderStatusElement.title = e.toString();
      } finally {
        setExecuting(false);
      }
    })()
  }
});

//////////////////////////////////////////////////////////////////////
// Utility functions
//////////////////////////////////////////////////////////////////////

runButton.onclick = () => render({ now: true });

function normalizeSource(src) {
  return src.replaceAll(/\/\*.*?\*\/|\/\/.*?$/gm, '')
    .replaceAll(/([,.({])\s+/gm, '$1')
    .replaceAll(/\s+([,.({])/gm, '$1')
    .replaceAll(/\s+/gm, ' ')
    .trim()
}
function normalizeStateForCompilation(state) {
  return {
    ...state,
    source: {
      ...state.source,
      content: normalizeSource(state.source.content)
    },
  }
}

function updateExperimentalCheckbox(temptativeChecked) {
  const features = Object.keys(featureCheckboxes).filter(f => featureCheckboxes[f].checked);
  const hasFeatures = features.length > 0;
  // showExperimentalFeaturesCheckbox.checked = hasFeatures || (temptativeChecked ?? showExperimentalFeaturesCheckbox.checked);
  // showExperimentalFeaturesCheckbox.disabled = hasFeatures;
}

function setFeatures() {
  let state = globalThis.parapart;
  let features = new Set();
  if (state.features) {
    features = new Set(state.features);
    Object.keys(featureCheckboxes).forEach(f => featureCheckboxes[f].checked = features.has(f));
  }
  autorenderCheckbox.checked = state.autorender ?? true;
  autoparseCheckbox.checked = state.autoparse ?? true;

  setAutoRotate(state.autorotate ?? true)
  setViewerFocused(state.viewerFocused ?? false);
  updateExperimentalCheckbox(state.showExp ?? false);
}

// Handle changes to state.
var previousNormalizedState = "";
function onStateChanged({ allowRun }) {
  //console.log("STATE CHANGED: " + JSON.stringify(globalThis.parapart.part));

  // Save new part state in URL
  writePartToURL(globalThis.parapart.changed, globalThis.parapart.part);

  featuresContainer.style.display = showExperimentalFeaturesCheckbox.checked ? null : 'none';

  globalThis.parapart.source.content = editor.getValue();

  const normalizedState = JSON.stringify(normalizeStateForCompilation(globalThis.parapart));
  //console.log("PREV: " + JSON.stringify(previousNormalizedState));
  //console.log("CURR: " +JSON.stringify(normalizedState));
  if (previousNormalizedState != normalizedState) {
    previousNormalizedState = normalizedState;

    if (allowRun && globalThis.parapart.changed) {
      if (autoparseCheckbox.checked) {
        checkSyntax({ now: false });
      }
      if (autorenderCheckbox.checked) {
        render({ now: false });
      }
    }
  }
}


var definedLightTheme = false;
function setDarkMode(dark) {
  // Set bg to transparent to avoid flicker of old color.  
  if (dark) {
    darkButton.style.display = "none";
    lightButton.style.display = "block";
    document.documentElement.setAttribute("data-theme", "dark");
    monaco.editor.setTheme('pp-dark');
    render({ now: true });
  } else {
    darkButton.style.display = "block";
    lightButton.style.display = "none";
    document.documentElement.setAttribute("data-theme", "garden");

    // Only need to define this once, but need to be in light-mode 
    // to fetch the bg color from the CSS theme
    if (definedLightTheme == false) {
      monaco.editor.defineTheme('pp-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#bdbcbc',
        }
      });
      definedLightTheme = true;
    }
    monaco.editor.setTheme('pp-light');
    render({ now: true });
  }
}

////////////////////////////////////////////////////////////////////////////
// App Initialization
////////////////////////////////////////////////////////////////////////////


try {
  const workingDir = '/home';
  const fs = await createEditorFS(workingDir);
  await registerOpenSCADLanguage(fs, workingDir, zipArchives);

  //console.log(getStyle('stop-render', 'background'));
  let bgcolor = rgba2hex(getStyle('stop-render', 'background'));
  monaco.editor.defineTheme('pp-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [  ],
    colors: {
      'editor.background': '#'+bgcolor,
    }
  });

  // Create the source editor
  editor = monaco.editor.create(editorElement, {
    // value: source,
    lineNumbers: false,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    fontSize: 12,
    tabSize: 2,
    language: 'openscad',
    theme: 'pp-dark',
  });

  editor.onDidChangeModelContent(() => {
    let savedCustomization = globalThis.parapart.part.customization;
    // Rebuild the customization tabs and reset the fields
    buildCustomizer(editor.getValue());

    globalThis.parapart.changed = false;

    // If this is the first time through and we had some
    // customizations from the URL, overwrite the generated
    // ones 
    if (initialLoad) {
      //console.log("* INITIAL LOAD");

      if (! isEmpty(savedCustomization)) {
        console.log("HAVE CUSTOMIZATIONS FROM URL");
        // Merge in the saved customizations
        let merged = {
          ...globalThis.parapart.part.customization,
          ...savedCustomization
        };
        globalThis.parapart.part.customization = merged;
        // Set changed flag to true to force a rerender
        globalThis.parapart.changed = true;
      }
      initialLoad = false;
    }
    // Process the stat change
    onStateChanged({ allowRun: true }); 
  });

  // Create the STL Viewer
  stlViewer = buildStlViewer();
  //stlViewer.set_grid(true);
  stlViewerElement.ondblclick = () => {
    console.log("Tap detected!");
    setAutoRotate(!autorotateCheckbox.checked);
    //onStateChanged({ allowRun: false });
  };

  await buildFeatureCheckboxes(featuresContainer, featureCheckboxes, () => {
    updateExperimentalCheckbox();
    //onStateChanged({ allowRun: true });
  });


const defaultState = {
  part: {
    id: 0,
    customization: { },
    changed: false,
  },
  source: {
    name: 'input.stl',
    content: `
  translate([-50, 0, 50])
  linear_extrude(5)
  text("PARAPART");
`},
  viewerFocused: false,
  features: ['fast-csg', 'fast-csg-trust-corefinement', 'fast-csg-remesh', 'fast-csg-exact-callbacks', 'lazy-union'],
};

  // Set up our global state
  globalThis.parapart = defaultState;

  // Not sure why this doesn't work
  globalThis.parapart.onchange = () => {
    globalThis.parapart.changed = true;
    //console.log("GLOBALTHIS CHANGED");
    onStateChanged({ allowRun: true });
  }
  // But this does
  globalThis.onchange = () => {
    globalThis.parapart.changed = true;
    //console.log("GLOBALTHIS CHANGED");
    onStateChanged({ allowRun: true });
  }

  globalThis.parapart.part = readPartFromURL();

  // Save the default source to the editor
  //editor.setValue(globalThis.parapart.source.content);

  setFeatures();

  // Set up the part rendering function that we will apply
  // to the parts in the gallery
  let renderPartFunc = (id, scadText, stlText) => {
    var fname = "parapart" + id + ".stl";

    // Build new local file for STL Viewer
    const blob = new Blob([stlText], { type: "application/octet-stream" });
    stlFile = new File([blob], fname);

    // Update the STL download link
    addDownloadLink(linkContainerElement, blob, fname);

    // Did we get here by reading the part from the URL?
    if( id != globalThis.parapart.part.id ) {
      console.log("No Part ID in URL - Gallery pick");
      // No - we picked this from the gallery. No
      // customizations yet.
      globalThis.parapart.part.id = id;
      globalThis.parapart.part.customization = { },
      globalThis.parapart.changed = false;
      viewStlFile();
    } else {
      console.log("Part ID obtained from URL");
      // There was We have an ID.  Do we have any customizations?
      if( globalThis.parapart.changed ){
        console.log("customizations obtained from URL");
        // Yes.  The base STL we have won't represent
        // the linked part, so re-render
        globalThis.parapart.changed = true;
      } else {
        // No changes - URL contained just a part ID
        viewStlFile();
        // Force 
        setExecuting(false);
      }
    }

    // Save the SCAD source.  
    // TODO - we can probably just use the editor for this
    globalThis.parapart.source.content = scadText;
    //console.log("SCAD: " + scadText);

    editor.setValue(globalThis.parapart.source.content);
  }

  // This stuff needs DB access and should just be done after db init
  let postDatabaseInitFunc = () => {

    // Build the parts gallery
    buildGallery(renderPartFunc);

    let part = globalThis.parapart.part;
    // Did we load the page with a part ID?
    if (part.id != 0) {
      // Close the gallery
      document.getElementById('nav-overlay').style.width = "0vh";

      // Edit the part as though we chose it from the gallery
      let dir = String(Math.floor(parseInt(part.id) / 100)).padStart(3, '0');
      let file = String(parseInt(part.id) % 100).padStart(3, '0');
      editPart(part.id, `assets/local_scad/${dir}/${file}.scad`);
    }
  }

  // Load the database and then do initializations that need db access
  loadDatabase(postDatabaseInitFunc);

  //////////////////////////////////////////////////////////////////
  // Add HTML element actions
  //////////////////////////////////////////////////////////////////
  document.getElementById("mainlogo").onclick = function () { buildSection(0); }
  darkButton.onclick = () => { setDarkMode(true); }
  lightButton.onclick = () => { setDarkMode(false); }
  searchBox.onchange = () => { buildSearchResults(searchBox.value); }

  // Handle log tab visibility
  showLogsElement.checked = false;
  showLogsElement.onchange = () => {
    if (showLogsElement.checked) {
      document.getElementById('tablogs').style.display = "block";
    } else {
      document.getElementById('tablogs').style.display = "none";
    }
  }

  // Handle log tab visibility
  showEditorElement.checked = false;
  showEditorElement.onchange = () => {
    if (showEditorElement.checked) {
      document.getElementById('tabedit').style.display = "block";
    } else {
      document.getElementById('tabedit').style.display = "none";
    }
  }

  // Clipboard + toast handler for share link
  document.getElementById("get-part-link").onclick = copyURIToClipboard;


  showExperimentalFeaturesCheckbox.onchange = () => onStateChanged({ allowRun: false });

  autorenderCheckbox.onchange = () => onStateChanged({ allowRun: autorenderCheckbox.checked });
  autoparseCheckbox.onchange = () => onStateChanged({ allowRun: autoparseCheckbox.checked });
  autorotateCheckbox.onchange = () => {
    stlViewer.set_auto_rotate(autorotateCheckbox.checked);
    //onStateChanged({ allowRun: false });
  };

  // TODO - this was for mobile displays - layout is currently broken
  flipModeButton.onclick = () => {
    const wasViewerFocused = isViewerFocused();
    setViewerFocused(!wasViewerFocused);

    if (!wasViewerFocused) {
      setAutoRotate(false);
    }
    //onStateChanged({ allowRun: false });
  };

} catch (e) {
  console.trace();
  console.error(e);
}

