import { log, warn, error } from './log.js';
import { setupAddPart } from './add-part.js';

var db;
var miniViewer;
var miniViewerDiv;
var renderPartFunc;

function base64ToBinary(data) {
  var rawLength = data.length;
  //var array = new Uint8Array(new ArrayBuffer(rawLength));
  var array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; i++) {
    array[i] = data.charCodeAt(i);
  }
  return array.buffer;
}
export var getStyle = function(elementId, property) {
  let element = document.getElementById(elementId);
  return window.getComputedStyle ? window.getComputedStyle(element, null).getPropertyValue(property) : element.style[property.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); })];
};

async function fetchRawFromGitHub(owner, repo, branch, path, id, completedCallback) {
  console.log(`FETCHING GITHUB: https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`);
  return fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
    ).then(response => response.text()
    ).then(function(response) {completedCallback(id, response);}
    ).catch(function (error) {
      console.log("Fetch Error" + error);
    });
}

// Fetch from local web tree
async function fetchLocal(fileName, completedCallback) {
  console.log("FETCHING LOCAL " + fileName);
  return fetch(fileName
  ).then(response => response.text()
  ).then(function(response) { completedCallback(response); }
  ).catch(function (error) {
    console.log("Fetch Error:" + error );
  });
}

// Test func for serving from local server
async function fetchLocalSCAD(fileName, id, completedCallback) {
  console.log("FETCHING LOCAL SCAD" + fileName);
  return fetch(fileName
  ).then(response => response.text()
  ).then(function(response) { completedCallback(id, response); }
  ).catch(function (error) {
    console.log("Fetch Error:" + error );
  });
}

// We've either clicked on a part in the gallary, or we loaded the
// main page with a partID in the URL.  Fetch the scad and fetch the
// STL file.
var stashedSTL = null;
var stashedSCAD = null;
export async function editPart(id, url) {
  console.log("EDIT NEW PART - ID:" + id + " URL: " + url);
  // Fetch the STL and then fetch the SCAD.  These both return promises
  // so wait for them to finish here. 
  await fetchSTL(id, function (data) { stashedSTL = data;}); // Cheezy.  Should use browserFS
  await fetchRawFromGitHub('nbr0wn','parapart','main', 'docs/'+url, id, function(id,data) { stashedSCAD = data;});

  // Swap for above when serving from local server
  //await fetchLocalSCAD(url, id, function(data) { stashedSCAD = data;});

  renderPartFunc(id, stashedSCAD, stashedSTL);
}

function fetchSTL(partId, processFunc) {
  console.log("FETCHING STL FOR PART ID:", partId);
  let dir = String(Math.floor(parseInt(partId) / 100)).padStart(3, '0');
  let file = String(parseInt(partId) % 100).padStart(3, '0');
  let url = `assets/local_stl/${dir}/${file}.stl`;
  fetchLocal(url, function (data) { processFunc(data); });
}

function miniViewSTL(data) {
  const fileName = 'foo.stl';
  const blob = new Blob([data], { type: "application/octet-stream" });
  const stlFile = new File([blob], fileName);
  // Set the miniViewer color to match the current style
  const style = getComputedStyle(document.getElementById("nav-overlay"));
  miniViewer.set_bg_color(style.backgroundColor);
  let modelColor = getStyle("lightmode", "backgroundColor");
  try { miniViewer.clean(); } catch (e) { console.log("STLVIEW ERROR: " + e + e.stack); }
  try { miniViewer.add_model({ id: 1, local_file: stlFile, color: modelColor }) } catch (e) { console.log("STLVIEW ERROR: " + e); }
}

function showViewer(event) {
  // Move the miniViewer to the current target 
  miniViewerDiv.style.left = event.target.offsetLeft + "px";
  miniViewerDiv.style.top = event.target.offsetTop + "px";
  miniViewerDiv.style.zIndex = 50;
  miniViewerDiv.onclick = function () { miniViewerDiv.style.zIndex = -50; miniViewer.clean(); event.target.onclick(); }
  miniViewerDiv.onmouseleave = function () { miniViewerDiv.style.zIndex = -50; miniViewer.clean(); }
  fetchSTL(event.target.partId, miniViewSTL);
}

export function getSectionList() {
  let section_list = [];
  db.exec({
    sql: "SELECT id, name FROM section WHERE id NOT IN (select distinct parent_id from section) ORDER BY name ASC",
    rowMode: 'object',
    callback: function (row) {
      let entry = [row.id, row.name];
      section_list.push(entry);
    }.bind({ counter: 0 })
  });
  return section_list;
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

function pushSectionBreadcrumb(id) {
  let name = "Home";
  let imgURI = "assets/section_images/home.png";
  db.exec({
    sql: `select * from section where id = ${id}`,
    rowMode: 'object',
    callback: function (row) {
      name = row.name;
      imgURI = "assets/section_images/" + row.image;
    }.bind({ counter: 0 })
  });

  pushBreadcrumb(name, imgURI, id, true);
}

function pushBreadcrumb(name, imgURI, id, click) {

  let li = document.createElement("li");
  if(click) {
    li.onclick = function() { buildSection(id);}; 
    li.classList.add("cursor-pointer");
  }
  li.classList.add("flex");
  li.classList.add("items-center");
  li.classList.add("space-x-2");

  let img = document.createElement("img");
  img.src = imgURI;
  img.alt = name;
  img.classList.add("w-8");
  img.classList.add("h-8");
  img.innerHTML="";

  let span = document.createElement('span');
  span.innerHTML = name;
  if(click) {
    span.onclick = function() { buildSection(id);}; 
    span.classList.add("cursor-pointer");
  }

  li.appendChild(img);
  li.appendChild(span);

  // Stick it at the front of the list
  let breadcrumbs = document.getElementById("pp-breadcrumbs");
  let firstChild = breadcrumbs.firstElementChild;
  breadcrumbs.insertBefore(li, firstChild);
}

function addBreadcrumbs(id){
  pushSectionBreadcrumb(id);
  let parent_id = getParentId(id);
  while (parent_id > 0) {
    pushSectionBreadcrumb(parent_id);
    parent_id = getParentId(parent_id);
  }
  if( id > 0) {
    pushSectionBreadcrumb(0);
  }
}

function addTile(destination, name, id, imgURI, clickFunc, showMiniViewer) {
  //console.log("ADDING PART:" + name)
  const gallery = document.getElementById(destination);
  let img = document.createElement("img");
  img.classList.add("col");
  img.src = imgURI;
  img.alt = "part image";
  img.title = name;
  img.innerHTML="";
  if( showMiniViewer ) {
    img.onmousemove = showViewer;
  }
  img.onclick = clickFunc;
  img.partId = id;

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
  addTile("gallery", name, id, imgURI, 
    function() { 
      document.getElementById("nav-overlay").style.width = "0vw"; 
      editPart(id, url);
    }, 
    true );
}

function addSectionTile(name, id, imgURI) {
  addTile("categories", name, 0, imgURI, function() { buildSection(id);}, false);
}

export function clearGallery(id) {
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
  const breadcrumbs = document.getElementById("pp-breadcrumbs");
  while(breadcrumbs.firstChild) {
    breadcrumbs.removeChild(breadcrumbs.firstChild);
  }
}


export function buildSection(id) {
  clearGallery();

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
   //console.log(id);

  // Add the part tiles ( if any )
  db.exec({
    sql: `SELECT * FROM part INNER JOIN part_section ON part_section.part_id = part.id WHERE part_section.section_id = '${id}'`,
    rowMode: 'object',
    callback: function (row) {
      //console.log(`${row.name} ${row.id} ${dir} ${file}`);
      // Image directories are broken up into groups of 100
      let dir = String(Math.floor(parseInt(row.id) / 100)).padStart(3,'0')
      let file = String(parseInt(row.id) % 100).padStart(3,'0')
      addPartTile(row.name, row.id, `assets/local_scad/${dir}/${file}.scad`, `assets/part_images/${dir}/${file}.png`);
    }.bind({ counter: 0 })
  });
}
export function buildSearchResults(searchString) {
  clearGallery();

  // Show breadcrumbs
  pushBreadcrumb("Search Results", "assets/section_images/search_results.png", 0, false);
  addBreadcrumbs(0);

  let likeClause = searchString
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .map(word => { return '\'%' + word + '%\'' })
    .join(' OR name like ');
  //console.log(likeClause);

  // Add the section tiles ( if any )
  db.exec({
    sql: `select * from part where name like ${likeClause} limit 30`,
    rowMode: 'object',
    callback: function (row) {
      // Image directories are broken up into groups of 100
      let dir = String(Math.floor(parseInt(row.id) / 100)).padStart(3,'0')
      let file = String(parseInt(row.id) % 100).padStart(3,'0')
      addPartTile(row.name, row.id, `assets/local_scad/${dir}/${file}.scad`, `assets/part_images/${dir}/${file}.png`);
    }.bind({ counter: 0 })
  });
}

function buildMiniViewer() {
  miniViewerDiv = document.getElementById("miniviewer");
  // Setup our mini STL viewer
  miniViewer = new StlViewer(document.getElementById("miniviewer"), {});
  miniViewer.set_bg_color('transparent');
  miniViewer.set_center_models(true);
  miniViewer.set_auto_rotate(true);
  miniViewer.model_loaded_callback = id => {
    log("Model Loaded - ID:" + id)
    //miniViewer.style.display = "block";
    //log(getStyle("miniviewer","x"));
    //log(getStyle("miniviewer","y"));
  };
}

export function buildGallery(_renderPartFunc) {
  buildMiniViewer();
  // Stash this for gallery use
  renderPartFunc = _renderPartFunc;
  log("** Building Gallery")
  buildSection(0);
  // Setup handler for the add part dialog
  setupAddPart(getSectionList());
}

export function loadDatabase(postDatabaseInitFunc) {
  log("** Initializing sqlite database")
  self.sqlite3InitModule({
    print: log,
    printErr: error
  }).then(function (sqlite3) {
    try {
      fetchLocal('db.base64', function (data) {
        const dataArray = new Uint8Array(base64ToBinary(atob(data)));
        const p = sqlite3.wasm.allocFromTypedArray(dataArray);
        db = new sqlite3.oo1.DB();
        log("LOADED DB", db);
        db.onclose = { after: function () { sqlite3.wasm.dealloc(p) } };
        const rc = sqlite3.capi.sqlite3_deserialize(
          db.pointer, 'main', p, dataArray.length, dataArray.length,
          0
        );
        // Everything was ok.  Call post-init
        postDatabaseInitFunc();
      });
    } catch (e) {
      error("Exception:", e.message);
    }
  });
}