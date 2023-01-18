import { createWasmMemory, spawnOpenSCAD } from './openscad-runner.js'
import { registerOpenSCADLanguage } from './openscad-editor-config.js'
import { writeStateInFragment, readStateFromFragment } from './state.js'
import { buildFeatureCheckboxes } from './features.js';
import { buildCustomizer } from './control-parser.js';
import { buildGallery, loadDatabase, buildSearchResults, buildSection, editPart } from './gallery.js';
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

const defaultState = {
  part: {
    id: 0,
    configurator: {},
  },
  source: {
    name: 'input.stl',
    content: `
  translate([-50, 0, 50])
  linear_extrude(5)
  text("PARAPART");
`},
  maximumMegabytes: 1024,
  viewerFocused: false,
  // maximumMegabytes: 512,
  features: ['fast-csg', 'fast-csg-trust-corefinement', 'fast-csg-remesh', 'fast-csg-exact-callbacks', 'lazy-union'],
};


const featureCheckboxes = {};

var persistCameraState = false; // If one gets too far, it's really hard to auto reset and can be confusing to users. Just restart.
var stlViewer;
var stlFile;

function buildStlViewer() {
  const stlViewer = new StlViewer(stlViewerElement, {});
  stlViewer.set_bg_color('transparent');
  stlViewer.model_loaded_callback = id => {
  };
  return stlViewer;
}

function viewStlFile() {
  //console.log(stlViewer.get_camera_state());
  stlViewer.set_camera_state({ position: { x: -100, y: 0, z: 100 }, up: { x: 0, y: 1, z: 0 }, target: { x: 0, y: 0, z: 0 } })
  try { stlViewer.clean(); stlViewer.remove_model(1); } catch (e) { }
  stlViewer.add_model({ id: 1, local_file: stlFile, color: modelColor });
  //console.log(stlViewer);
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
  if (n < 1000) {
    return n + 'ms';
  }
  let seconds = Math.floor(n / 1000);
  let ms = Math.floor(n % 1000).toString().padStart(3,'0');
  return `${seconds}.${ms} s`;
}

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
    renderStatusElement.innerText = 'rendering...';
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

  console.log("SOURCE: " + source);
  console.log("CUSTOMIZATION: " + JSON.stringify(globalThis.customizations));

  const job = spawnOpenSCAD({
    // wasmMemory,
    inputs: [
      ['input.scad', source],
      ['customizations.json', JSON.stringify(globalThis.customizations)]
    ],
    args: [
      "input.scad",
      "-o", "out.stl",
      "--summary", "all",
      "-p", "customizations.json",
      "-P", "first",
      ...Object.keys(featureCheckboxes).filter(f => featureCheckboxes[f].checked).map(f => `--enable=${f}`),
    ],
    outputPaths: ['out.stl']
  });

  return {
    kill: () => job.kill(),
    completion: (async () => {
      try {
        const result = await job;
        //console.log(result);
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

        viewStlFile(stlFile);

        addDownloadLink(linkContainerElement, blob, fileName);
      } catch (e) {
        console.error(e, e.stack);
        renderStatusElement.innerText = '[Render Failed]';
        renderFailed = true;
        linkContainerElement.classList.add("btn-disabled");
        renderStatusElement.title = e.toString();
      } finally {
        setExecuting(false);
      }
    })()
  }
});

runButton.onclick = () => render({ now: true });

function getState() {
  const features = Object.keys(featureCheckboxes).filter(f => featureCheckboxes[f].checked);
  return {
    part: {
      id: currentPartId,
      customizations: globalThis.customizations.first,
    },
    source: {
      name: sourceFileName,
      content: editor.getValue(),
    },
    autorender: autorenderCheckbox.checked,
    autoparse: autoparseCheckbox.checked,
    autorotate: autorotateCheckbox.checked,
    // showedges: showedgesCheckbox.checked,
    // maximumMegabytes: Number(maximumMegabytesInput.value),
    features,
    viewerFocused: isViewerFocused(),
    // showExp: features.length > 0 || showExperimentalFeaturesCheckbox.checked,
    showExp: showExperimentalFeaturesCheckbox.checked,
    camera: persistCameraState ? stlViewer.get_camera_state() : null,
  };
}

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

// var wasmMemory;
// var lastMaximumMegabytes;
// function setMaximumMegabytes(maximumMegabytes) {
//   if (!wasmMemory || (lastMaximumMegabytes != maximumMegabytes)) {
//     wasmMemory = createWasmMemory({maximumMegabytes});
//     lastMaximumMegabytes = maximumMegabytes;
//   }
// }

function updateExperimentalCheckbox(temptativeChecked) {
  const features = Object.keys(featureCheckboxes).filter(f => featureCheckboxes[f].checked);
  const hasFeatures = features.length > 0;
  // showExperimentalFeaturesCheckbox.checked = hasFeatures || (temptativeChecked ?? showExperimentalFeaturesCheckbox.checked);
  // showExperimentalFeaturesCheckbox.disabled = hasFeatures;
}

function setState(state) {
  currentPartId = state.part.id;
  editor.setValue(state.source.content);
  sourceFileName = state.source.name || 'input.scad';
  if (state.camera && persistCameraState) {
    //stlViewer.set_camera_state(state.camera);
  }
  let features = new Set();
  if (state.features) {
    features = new Set(state.features);
    Object.keys(featureCheckboxes).forEach(f => featureCheckboxes[f].checked = features.has(f));
  }
  autorenderCheckbox.checked = state.autorender ?? true;
  autoparseCheckbox.checked = state.autoparse ?? true;

  // stlViewer.set_edges(1, showedgesCheckbox.checked = state.showedges ?? false);

  setAutoRotate(state.autorotate ?? true)
  setViewerFocused(state.viewerFocused ?? false);
  updateExperimentalCheckbox(state.showExp ?? false);

  // const maximumMegabytes = state.maximumMegabytes ?? defaultState.maximumMegabytes;
  // setMaximumMegabytes(maximumMegabytes);
  // maximumMegabytesInput.value = maximumMegabytes;
}

var previousNormalizedState;
function onStateChanged({ allowRun }) {
  const newState = getState();
  console.log("NEW STATE: " + JSON.stringify(newState.part));
  writeStateInFragment(newState.part);

  featuresContainer.style.display = showExperimentalFeaturesCheckbox.checked ? null : 'none';

  const normalizedState = normalizeStateForCompilation(newState);
  if (JSON.stringify(previousNormalizedState) != JSON.stringify(normalizedState)) {
    previousNormalizedState = normalizedState;

    if (allowRun) {
      if (autoparseCheckbox.checked) {
        checkSyntax({ now: false });
      }
      if (autorenderCheckbox.checked) {
        render({ now: false });
      }
    }
  }
}

function pollCameraChanges() {
  if (!persistCameraState) {
    return;
  }
  let lastCam;
  setInterval(function () {
    const ser = JSON.stringify(stlViewer.get_camera_state());
    if (ser != lastCam) {
      lastCam = ser;
      //onStateChanged({ allowRun: false });
    }
  }, 1000); // TODO only if active tab
}

function setDarkMode(dark) {
  // Set bg to transparent to avoid flicker of old color.  
  if (dark) {
    darkButton.style.display = "none";
    lightButton.style.display = "block";
    document.documentElement.setAttribute("data-theme", "dark");
    render({ now: true });
  } else {
    darkButton.style.display = "block";
    lightButton.style.display = "none";
    document.documentElement.setAttribute("data-theme", "garden");
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

  // Create the source editor
  editor = monaco.editor.create(editorElement, {
    // value: source,
    lineNumbers: false,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    fontSize: 12,
    tabSize: 2,
    language: 'openscad',
  });

  editor.onDidChangeModelContent(() => {
    console.log("EDITOR CONTENTS CHANGED");
    // Rebuild the customization tabs;
    globalThis.customizations = buildCustomizer(editor.getValue());
    onStateChanged({ allowRun: true });
  });

  // Create the STL Viewer
  stlViewer = buildStlViewer();
  stlViewer.set_grid(true);
  stlViewerElement.ondblclick = () => {
    console.log("Tap detected!");
    setAutoRotate(!autorotateCheckbox.checked);
    //onStateChanged({ allowRun: false });
  };

  await buildFeatureCheckboxes(featuresContainer, featureCheckboxes, () => {
    updateExperimentalCheckbox();
    //onStateChanged({ allowRun: true });
  });


  const initialState = readStateFromFragment() || defaultState;
  setState(initialState);

  // Initialize the global customizations object
  //globalThis.customizations = parseScad(initialState.source);

  globalThis.customizations = { "parameterSets": { "first": {} } };
  globalThis.customizations.parameterSets.first = initialState.customizations;

  // Not sure why this doesn't work
  globalThis.customizations.onchange = render;
  // But this does
  globalThis.onchange = render;

  // Set up the part rendering function
  let renderPartFunc = (id, scadText) => {
    console.log("Rendering part " + id);
    var localState = defaultState
    localState.part.id = id;
    localState.part.customizations = { "parameterSets": { "first": {} } };
    localState.source.content = scadText;
    setState(localState);
  }

  // This stuff needs DB access 
  let postDatabaseInitFunc = () => {
    buildGallery(renderPartFunc);

    let initialState = getState();

    // Did we load the page with a part ID?
    console.log("*****   HAVE PART ID IN URL: " + initialState.part.id);
    if (initialState.part.id != 0) {
      console.log("VALID PART ID FOUND");
      document.getElementById('nav-overlay').style.width = "0vh";
      let dir = String(Math.floor(parseInt(initialState.part.id) / 100)).padStart(3, '0');
      let file = String(parseInt(initialState.part.id) % 100).padStart(3, '0');
      editPart(initialState.part.id, `assets/local_scad/${dir}/${file}.scad`);
    }
  }

  // Load the database and then do initializations that need db access
  loadDatabase(postDatabaseInitFunc);

  // Add HTML element actions
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

  // Clipboard + toast handler for share link
  document.getElementById("get-part-link").onclick = function () {
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

  pollCameraChanges();

  //onStateChanged({ allowRun: true });

} catch (e) {
  console.trace();
  console.error(e);
}

