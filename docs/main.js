import { createWasmMemory, spawnOpenSCAD } from './openscad-runner.js'
// import OpenScad from "./openscad.js";
import { registerOpenSCADLanguage } from './openscad-editor-config.js'
import { writeStateInFragment, readStateFromFragment } from './state.js'
import { buildFeatureCheckboxes } from './features.js';
import { parseScad, cleanupControls } from './control-parser.js';
import { loadDatabase, buildSection } from './gallery.js';

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
const logsElement = document.getElementById("logs");
const featuresContainer = document.getElementById("features");
const flipModeButton = document.getElementById("flip-mode");
// const maximumMegabytesInput = document.getElementById("maximum-megabytes");
// const copyLinkButton = document.getElementById("copy-link");


/////////////////////////////////////////////////////////////////
// PARAPART - Cribbed from sqlite3 wasm demo
/////////////////////////////////////////////////////////////////
// Create Log output area
let logHtml = function (cssClass, ...args) {
  const ln = document.createElement('div');
  if (cssClass) ln.classList.add(cssClass);
  ln.append(document.createTextNode(args.join(' ')));
  document.getElementById('logs').append(ln);
};
const log = (...args) => logHtml('', ...args);
const warn = (...args) => logHtml('warning', ...args);
const error = (...args) => logHtml('error', ...args);

var miniViewer;

const darkButton = document.getElementById('darkmode');
const lightButton = document.getElementById('lightmode');

var modelColor;
var renderFailed = true;

/////////////////////////////////////////////////////////////////
// END
/////////////////////////////////////////////////////////////////

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
  stlViewer.set_camera_state({position: {x:-100,y:0,z:100}, up:{x:0,y:1,z:0}, target:{x:0,y:0,z:0}})
  try { stlViewer.clean(); stlViewer.remove_model(1); } catch (e) { }
  stlViewer.add_model({ id: 1, local_file: stlFile, color:modelColor });
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
    return `${Math.floor(n / 1000)} sec`;
  }
  return `${Math.floor(n / 100) / 10} sec`;
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
  if(isExecuting) {
    linkContainerElement.classList.add("btn-disabled");
    killButton.classList.remove("btn-disabled");
    runButton.classList.add("btn-disabled");
  } else {
    if(renderFailed == false )
    {
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

  logsElement.innerText = allLines.join("\n")
  // logsElement.innerText = unmatchedLines.join("\n")

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
        console.log(result);
        processMergedOutputs(editor, result.mergedOutputs, timestamp);
      } catch (e) {
        console.error(e);
      }
    })()
  };
});

var sourceFileName;
var editor;

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
  renderStatusElement.innerText = 'rendering...';
  renderStatusElement.title = null;
  runButton.classList.add("btn-disabled");
  setExecuting(true);
  renderFailed = false;

  const job = spawnOpenSCAD({
    // wasmMemory,
    inputs: [
      ['input.scad', source],
      ['customizations.json', JSON.stringify(globalThis.customizations)]
    ],
    args: [
      "input.scad",
      "-o", "out.stl",
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

const defaultState = {
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
  writeStateInFragment(newState);

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
      onStateChanged({ allowRun: false });
    }
  }, 1000); // TODO only if active tab
}

////////////////////////////////////////////////////////////////////////////
// PARAPART STUFF
////////////////////////////////////////////////////////////////////////////

function setDarkMode(dark) {
  // Set bg to transparent to avoid flicker of old color.  
  miniViewer.set_bg_color('transparent');
  if(dark) {
    darkButton.style.display="none";
    lightButton.style.display="block";
    document.documentElement.setAttribute("data-theme", "dark");
    render({ now: true });
  } else {
    darkButton.style.display="block";
    lightButton.style.display="none";
    document.documentElement.setAttribute("data-theme", "corporate");
    render({ now: true });
  }
}

//////////////////////////////////////////////////////////////////////////
// End Parapart Stuff
//////////////////////////////////////////////////////////////////////////

try {
  const workingDir = '/home';
  const fs = await createEditorFS(workingDir);
  await registerOpenSCADLanguage(fs, workingDir, zipArchives);

  editor = monaco.editor.create(editorElement, {
    // value: source,
    lineNumbers: false,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    fontSize: 12,
    tabSize: 2,
    language: 'openscad',
  });
  editor.addAction({
    id: "run-openscad",
    label: "Run OpenSCAD",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
    run: () => render({ now: true }),
  });

  stlViewer = buildStlViewer();
  stlViewer.set_grid(true);
  stlViewerElement.ondblclick = () => {
    console.log("Tap detected!");
    setAutoRotate(!autorotateCheckbox.checked);
    onStateChanged({ allowRun: false });
  };

  const initialState = readStateFromFragment() || defaultState;

  /////////////////////////////////////////////////////////
  ///////////////////////// PARAPART
  /////////////////////////////////////////////////////////

  // Initialize the global customizations object
  globalThis.customizations = parseScad(initialState.source);
  // Not sure why this doesn't work
  globalThis.customizations.onchange = render;
  // But this does
  globalThis.onchange = render;

  // Setup our mini STL viewer
  miniViewer = new StlViewer(document.getElementById("miniviewer"), {});
  miniViewer.set_bg_color('transparent');
  miniViewer.set_center_models(true);
  miniViewer.set_auto_rotate(true);
  miniViewer.model_loaded_callback = id => {
    //miniViewer.set_edges(1,true);
    console.log("Model Loaded:" + id)
  };

  // Build the top level gallery section
  // Add the logo onclick
  document.getElementById("mainlogo").onclick = function() { buildSection(0); }

  // Load the database and then build the top level nav elements
  // on completion
  loadDatabase(miniViewer);
  
  darkButton.onclick = () => { setDarkMode(true); }
  lightButton.onclick = () => { setDarkMode(false); }

  // Handle logs visibility
  showLogsElement.checked = false;
  showLogsElement.onchange = () => {
    if (showLogsElement.checked) {
      document.getElementById('tablogs').style.display = "block";
    } else {
      document.getElementById('tablogs').style.display = "none";
    }
  }

  document.getElementById("part-github").onchange = () => { 
    if (document.getElementById("part-github").checked) {
      document.getElementById('github-fields').style.display = "block";
      document.getElementById('non-github-file').style.display = "none";
    } else {
      document.getElementById('github-fields').style.display = "none";
      document.getElementById('non-github-file').style.display = "block";
    }
  }

  document.getElementById("add-part-form").onchange = () => { 
      console.log(document.getElementById('part-name').value);
      console.log(document.getElementById('part-section').value);
      console.log(document.getElementById('part-github').checked);
      console.log(document.getElementById('user-name').value);
      console.log(document.getElementById('repo-name').value);
      console.log(document.getElementById('branch-name').value);
      console.log(document.getElementById('file-path').value);
      console.log(document.getElementById('scad-text').value);
  }

  document.getElementById("add-part-btn").onclick = function() { 
    document.getElementById("nav-overlay").style.width = "0vw";
  }
  document.getElementById("add-part-modal").checked = false;

  document.getElementById("add-part-confirm").onclick = function() { 
    let TEXT="NAME:" + document.getElementById('part-name').value + "\n";
    TEXT +="SECTION:" + document.getElementById('part-section').value + "\n";
    if(document.getElementById('part-github').checked ) {
      TEXT += "USER:" + document.getElementById('user-name').value + "\n";
      TEXT += "REPO:" + document.getElementById('repo-name').value + "\n";
      TEXT += "BRANCH:" + document.getElementById('branch-name').value + "\n";
      TEXT += "PATH:" + document.getElementById('file-path').value + "\n";
    }
    else {
      TEXT += "SCAD: " + document.getElementById('scad-text').value;
    }
    let uriTxt = encodeURIComponent(TEXT);
    window.location.assign('https://github.com/nbr0wn/parapart/issues/new?title=SCAD&body='+uriTxt);
  }

  /////////////////////////////////////////////////////////
  ///////////////////////// END PARAPART
  /////////////////////////////////////////////////////////

  await buildFeatureCheckboxes(featuresContainer, featureCheckboxes, () => {
    updateExperimentalCheckbox();
    onStateChanged({ allowRun: true });
  });
  setState(initialState);

  showExperimentalFeaturesCheckbox.onchange = () => onStateChanged({ allowRun: false });

  autorenderCheckbox.onchange = () => onStateChanged({ allowRun: autorenderCheckbox.checked });
  autoparseCheckbox.onchange = () => onStateChanged({ allowRun: autoparseCheckbox.checked });
  autorotateCheckbox.onchange = () => {
    stlViewer.set_auto_rotate(autorotateCheckbox.checked);
    onStateChanged({ allowRun: false });
  };
  // showedgesCheckbox.onchange = () => onStateChanged({allowRun: false});

  flipModeButton.onclick = () => {
    const wasViewerFocused = isViewerFocused();
    setViewerFocused(!wasViewerFocused);

    if (!wasViewerFocused) {
      setAutoRotate(false);
    }
    onStateChanged({ allowRun: false });
  };
  // maximumMegabytesInput.oninput = () => {
  //   setMaximumMegabytes(Number(maximumMegabytesInput.value));
  //   onStateChanged({allowRun: true});
  // };

  //editor.focus();

  pollCameraChanges();

  onStateChanged({ allowRun: true });

  editor.onDidChangeModelContent(() => {
    // Remove the customizer tabs
    cleanupControls();
    // Rebuild the customization tabs;
    globalThis.customizations = parseScad(editor.getValue());
    console.log("EDITOR CHANGED");
    onStateChanged({ allowRun: true });
  });

} catch (e) {
  console.trace();
  console.error(e);
}

