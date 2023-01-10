import { createWasmMemory, spawnOpenSCAD } from './openscad-runner.js'
// import OpenScad from "./openscad.js";
import { registerOpenSCADLanguage } from './openscad-editor-config.js'
import { writeStateInFragment, readStateFromFragment } from './state.js'
import { buildFeatureCheckboxes } from './features.js';
import { parseScad, cleanupControls } from './control-parser.js';

const editorElement = document.getElementById('monacoEditor');
const runButton = document.getElementById('run');
const killButton = document.getElementById('kill');
const metaElement = document.getElementById('meta');
const linkContainerElement = document.getElementById('download');
const autorenderCheckbox = document.getElementById('autorender');
const autoparseCheckbox = document.getElementById('autoparse');
const autorotateCheckbox = document.getElementById('autorotate');
// const showedgesCheckbox = document.getElementById('showedges');
const showExperimentalFeaturesCheckbox = document.getElementById('show-experimental');
const stlViewerElement = document.getElementById("viewer");
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
  document.getElementById('tab-log').append(ln);
};
const log = (...args) => logHtml('', ...args);
const warn = (...args) => logHtml('warning', ...args);
const error = (...args) => logHtml('error', ...args);

var miniViewer;

const darkButton = document.getElementById('darkmode');
const lightButton = document.getElementById('lightmode');

// Theme and dark mode stuff
var lightBg = "#EFF5F5";
var lightFg = "#D6E4E5";

var darkBg = "#1D3E53";
var darkFg = "#476D7C";

var modelColor = darkFg;

/////////////////////////////////////////////////////////////////
// END
/////////////////////////////////////////////////////////////////

const featureCheckboxes = {};

var persistCameraState = false; // If one gets too far, it's really hard to auto reset and can be confusing to users. Just restart.
var stlViewer;
var stlFile;

function buildStlViewer() {
  const stlViewer = new StlViewer(stlViewerElement);
  stlViewer.set_bg_color('transparent');
  // const initialCameraState = stlViewer.get_camera_state();
  stlViewer.model_loaded_callback = id => {
    //stlViewer.set_color(id, modelColor);
    //stlViewer.set_display(id,"smooth");
    //stlViewer.set_grid(true);
    //stlViewer.set_auto_zoom(true);
    // stlViewer.set_auto_rotate(true);
    // stlViewer.set_edges(id, showedgesCheckbox.checked);
    // onStateChanged({allowRun: false});
    //console.log(stlViewer.get_camera_state());
  };
  return stlViewer;
}

function viewStlFile() {
  //console.log(stlViewer.get_camera_state());
  stlViewer.set_camera_state({position: {x:-100,y:0,z:100}, up:{x:0,y:1,z:0}, target:{x:0,y:0,z:0}})
  try { stlViewer.remove_model(1); } catch (e) { }
  stlViewer.add_model({ id: 1, local_file: stlFile, color:modelColor });
  //console.log(stlViewer);
}

function addDownloadLink(container, blob, fileName) {
  //const button = document.createElement('button');
  //button.id="download";
  //button.name="Foo";
  //button.value="Bar";
  //button.innerHTML = "Download " + fileName;
  //button.classList.add('button');
  //button.classList.add('settings');
  container.onclick = function downloadFile() {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
  };
  //container.append(button);
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

function setExecuting(v) {
  killButton.disabled = !v;
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
  metaElement.innerText = 'rendering...';
  metaElement.title = null;
  runButton.disabled = true;
  setExecuting(true);

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

        metaElement.innerText = "Render time: " + formatMillis(result.elapsedMillis);

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

        //linkContainerElement.innerHTML = '';
        addDownloadLink(linkContainerElement, blob, fileName);
      } catch (e) {
        console.error(e, e.stack);
        document.getElementById("download").disabled = true;
        metaElement.innerText = '[Render Failed]';
        metaElement.title = e.toString();
      } finally {
        setExecuting(false);
        runButton.disabled = false;
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

async function fetchFromGitHub(owner, repo, path) {
  //return fetch (
  //`https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`)
  return fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`)
    .then(response => response.json())
    .then(data => {
      return atob(data.content);
    }).catch(function () {
      console.log("Fetch Error");
    });
}

async function fetchRawFromGitHub(owner, repo, path, completedCallback) {
  return fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`
    ).then(response => response.text()
    ).then(function(response) {completedCallback(response);}
    ).catch(function (error) {
      console.log("Fetch Error" + error);
    });
}

async function fetchLocal(fileName, completedCallback) {
  console.log("FETCHING LOCAL " + fileName);
  return fetch(fileName
  ).then(response => response.text()
  ).then(function(response) { completedCallback(response); }
  ).catch(function (error) {
    console.log("Fetch Error:" + error );
  });
}

function base64ToBinary(data) {
  var rawLength = data.length;
  //var array = new Uint8Array(new ArrayBuffer(rawLength));
  var array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; i++) {
    array[i] = data.charCodeAt(i);
  }
  return array.buffer;
}

var db;

function loadDatabase() {
  self.sqlite3InitModule({
    print: log,
    printErr: error
  }).then(function (sqlite3) {
    try {
      fetchLocal('parapart.sqlite3', function (data) {
        const dataArray = new Uint8Array(base64ToBinary(atob(data)));
        const p = sqlite3.wasm.allocFromTypedArray(dataArray);
        db = new sqlite3.oo1.DB();
        log("LOADED DB", db);
        db.onclose = { after: function () { sqlite3.wasm.dealloc(p) } };
        const rc = sqlite3.capi.sqlite3_deserialize(
          db.pointer, 'main', p, dataArray.length, dataArray.length,
          0
        );
        buildSection(0);
      });
    } catch (e) {
      error("Exception:", e.message);
    }
  });
}

function buildSection(id) {
  // Clear the categories
  const categories = document.getElementById("categories");
  while(categories.firstChild) {
    categories.removeChild(categories.firstChild);
  }
  // Clear the gallery
  const gallery = document.getElementById("gallery");
  while(gallery.firstChild) {
    gallery.removeChild(gallery.firstChild);
  }
  // Clear the breadcrumbs
  const breadcrumbs = document.getElementById("breadcrumbs");
  while(breadcrumbs.firstChild) {
    breadcrumbs.removeChild(breadcrumbs.firstChild);
  }

  // Show breadcrumbs
  addBreadcrumbs(id);

  // Add the section tiles ( if any )
  db.exec({
    sql: `select * from section where parent_id = ${id}`,
    rowMode: 'object',
    callback: function (row) {
      // Create image from data
      addSectionTile(row.name, row.id, 'assets/section_images/'+row.image);
    }.bind({ counter: 0 })
  });

  // Add the part tiles ( if any )
  db.exec({
    sql: `select * from part p, hierarchy h where p.id = h.part_id AND h.section_id = ${id}`,
    rowMode: 'object',
    callback: function (row) {
      // Image directories are broken up into groups of 100
      let dir = String(Math.floor(parseInt(row.id) / 100)).padStart(3,'0')
      let file = String(parseInt(row.id) % 100).padStart(3,'0')
      addPartTile(row.name, row.id, `/local_scad/part${row.id}.scad`, `assets/part_images/${dir}/${file}.png`);
    }.bind({ counter: 0 })
  });
}

// This function is called when a user clicks on a part in the gallery
function editPart(url) {
  console.log("EDIT NEW PART:"+ url);
  ////const data = await fetchFromGitHub(user, repo, partFile);
  fetchRawFromGitHub('nbr0wn','parapart','docs/'+url,
  //fetchLocal(url, 
    function (data) {
    var localState  = defaultState
    localState.source.content = data;
    setState(localState);
    onStateChanged({ allowRun: true });
  });
}

function fetchSTL(part) {
  let url = 'test.stl';
  fetchLocal(url, function (data) {
    const fileName = 'foo.stl';
    const blob = new Blob([data], { type: "application/octet-stream" });
    const stlFile = new File([blob], fileName);
    try { miniViewer.remove_model(1); } catch (e) { console.log("STLVIEW ERROR: " + e); }
    try { miniViewer.add_model({ id: 1, local_file: stlFile, color:modelColor }) } catch (e) { console.log("STLVIEW ERROR: " + e); }
    console.log(miniViewer);
  });
}

function showViewer(event) {
  const viewer = document.getElementById("miniviewer");
  const canvas = viewer.getElementsByTagName("canvas")[0];

  viewer.style.left = event.target.offsetLeft + "px";
  viewer.style.top = event.target.offsetTop + "px";
  viewer.style.display = "block";
  viewer.onclick = function () { viewer.style.display = "none" ; event.target.onclick(); }
  viewer.onmouseleave = function () { viewer.style.display = "none"; }
  fetchSTL(event.target.partname);
}

function getParentId(id) {
  let parent_id = 0;
  db.exec({
    sql: `select parent_id, name from section where id = ${id}`,
    rowMode: 'object',
    callback: function (row) {
      parent_id = row.parent_id;
    }.bind({ counter: 0 })
  });
  return parent_id;
}

function pushBreadcrumb(id) {
  let name = "Home";
  let imgURI = "home.png";
  db.exec({
    sql: `select * from section where id = ${id}`,
    rowMode: 'object',
    callback: function (row) {
      name = row.name;
      imgURI = row.image;
    }.bind({ counter: 0 })
  });

  let li = document.createElement("li");
  li.onclick = function() { buildSection(id);};
  li.classList.add("flex");
  li.classList.add("items-center");
  li.classList.add("space-x-2");

  let img = document.createElement("img");
  img.src = "assets/section_images/" + imgURI;
  img.alt = name;
  img.classList.add("w-8");
  img.classList.add("h-8");
  img.innerHTML="";

  let span = document.createElement('span');
  span.innerHTML = name;

  li.appendChild(span);
  li.appendChild(img);

  // Stick it at the front of the list
  let breadcrumbs = document.getElementById("breadcrumbs");
  let firstChild = breadcrumbs.firstElementChild;
  breadcrumbs.insertBefore(li, firstChild);
}

function pushSeparator() {
  let li = document.createElement("li");
  li.innerHTML = "/";
  // Stick it at the front of the list
  let breadcrumbs = document.getElementById("breadcrumbs");
  let firstChild = breadcrumbs.firstElementChild;
  breadcrumbs.insertBefore(li, firstChild);
}

function addBreadcrumbs(id){
  pushBreadcrumb(id);
  let parent_id = getParentId(id);
  while (parent_id > 0) {
    pushSeparator(id);
    pushBreadcrumb(parent_id);

    parent_id = getParentId(parent_id);
  }
  if( id > 0) {
    pushSeparator(id);
    pushBreadcrumb(0);
  }
}

function addTile(destination, name, imgURI, clickFunc) {
  //console.log("ADDING PART:" + name)
  const gallery = document.getElementById(destination);
  let img = document.createElement("img");
  img.classList.add("col");
  img.src = imgURI;
  img.alt = "part image";
  img.title = name;
  img.innerHTML="";
  img.onmousemove=showViewer;
  img.onclick = clickFunc;
  img.partname = name;

  let cap = document.createElement("figcaption");
  cap.innerHTML = name;

  let fig = document.createElement("div");
  fig.classList.add("gallery-frame");
  fig.onclick = clickFunc;
  
  
  fig.appendChild(img);
  fig.appendChild(cap);
  gallery.appendChild(fig);
}


function addPartTile(name, id, url, imgURI) {
  addTile("gallery", name, imgURI, function() { document.getElementById("navOverlay").style.width = "0vw"; editPart(url);});
}

function addSectionTile(name, id, imgURI) {
  addTile("categories", name, imgURI, function() { buildSection(id);});
}

function setDarkMode(dark) {
  if(dark) {
    darkButton.style.display="none";
    lightButton.style.display="block";
    document.documentElement.setAttribute("data-theme", "business");
    modelColor = darkFg;
    miniViewer.set_bg_color(darkBg);
    render({ now: true });
  } else {
    darkButton.style.display="block";
    lightButton.style.display="none";
    document.documentElement.setAttribute("data-theme", "garden");
    modelColor = lightFg;;
    miniViewer.set_bg_color(lightBg);
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

  //const readDir = path => new Promise((res, rej) => fs.readdir(path, (err, files) => err ? rej(err) : res(files)));
  //console.log('readDir', '/', await readDir('/'));
  //console.log('readDir', workingDir, await readDir(workingDir));

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
  stlViewerElement.ondblclick = () => {
    console.log("Tap detected!");
    setAutoRotate(!autorotateCheckbox.checked);
    onStateChanged({ allowRun: false });
  };

  //stlViewerElement.onkeydown = e => {
    //if (e.key === "Escape" || e.key === "Esc") editor.focus();
  //};

  const initialState = readStateFromFragment() || defaultState;

  /////////////////////////////////////////////////////////
  ///////////////////////// PARAPART
  /////////////////////////////////////////////////////////

  // Initialize the global customizations object
  globalThis.customizations = parseScad(initialState.source);
  // Not sure why this doesn't work
  globalThis.customizations.onchange = render;
  // But this does
  //globalThis.onchange = render;

  // Setup our mini STL viewer
  miniViewer = new StlViewer(document.getElementById("miniviewer"));
  miniViewer.set_bg_color(darkBg);
  miniViewer.set_center_models(true);
  //miniViewer.set_auto_zoom(true);
  //miniViewer.set_auto_resize(false);
  miniViewer.set_auto_rotate(true);
  miniViewer.model_loaded_callback = id => {
    console.log("Model Loaded:" + id)
  };

  // Build the top level gallery section
  // Create the clickable logo
  let logo = document.createElement("img");
  logo.src = "assets/logo.png";
  logo.classList.add('hero-image');
  logo.onclick = function() { buildSection(0); }
  document.getElementById("mainlogo").appendChild(logo);
  // Load the database and then build the top level nav elements
  // on completion
  loadDatabase();
  
  darkButton.onclick = () => { setDarkMode(true); }
  lightButton.onclick = () => { setDarkMode(false); }

  /////////////////////////////////////////////////////////
  ///////////////////////// END PARAPART
  /////////////////////////////////////////////////////////

  //setState(initialState);
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

