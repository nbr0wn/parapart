import { log, warn, error } from './log.js';
import { setupAddPart } from './add-part.js';

var db;
var miniViewer;
var renderPartFunc;

async function fetchRawFromGitHub(owner, repo, branch, path, completedCallback) {
  return fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
    ).then(response => response.text()
    ).then(function(response) {completedCallback(response);}
    ).catch(function (error) {
      console.log("Fetch Error" + error);
    });
}

async function fetchLocal(fileName, completedCallback) {
  //console.log("FETCHING LOCAL " + fileName);
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

// This function is called when a user clicks on a part in the gallery
function editPart(url) {
  console.log("EDIT NEW PART:"+ url);
  fetchRawFromGitHub('nbr0wn','parapart','main', 'docs/'+url, renderPartFunc);

  //fetchLocal(url, 
    //function (data) {
      //renderPart(data);
  //});
}

var getStyle = function(elementId, property) {
  let element = document.getElementById(elementId);
  console.log(elementId);
  return window.getComputedStyle ? window.getComputedStyle(element, null).getPropertyValue(property) : element.style[property.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); })];
};

function fetchSTL(partId) {
  let dir = String(Math.floor(parseInt(partId) / 100)).padStart(3, '0');
  let file = String(parseInt(partId) % 100).padStart(3, '0');
  let url = `assets/local_stl/${dir}/${file}.stl`;
  fetchLocal(url, function (data) {
    const fileName = 'foo.stl';
    const blob = new Blob([data], { type: "application/octet-stream" });
    const stlFile = new File([blob], fileName);
    // Set the miniViewer color to match the current style
    const style = getComputedStyle(document.getElementById("nav-overlay"));
    miniViewer.set_bg_color(style.backgroundColor);
    let modelColor = getStyle("lightmode", "backgroundColor");
    try { miniViewer.clean(); } catch (e) { console.log("STLVIEW ERROR: " + e + e.stack); }
    try { miniViewer.add_model({ id: 1, local_file: stlFile, color:modelColor }) } catch (e) { console.log("STLVIEW ERROR: " + e); }
    //console.log(miniViewer);
  });
}

function showViewer(event) {
  const viewer = document.getElementById("miniviewer");

  // Move the miniViewer to the current target 
  viewer.style.left = event.target.offsetLeft + "px";
  viewer.style.top = event.target.offsetTop + "px";
  viewer.style.display = "block";
  viewer.onclick = function () { viewer.style.display = "none" ; event.target.onclick(); }
  viewer.onmouseleave = function () { viewer.style.display = "none"; }
  fetchSTL(event.target.partId);
}

export function getSectionList() {
  let section_list = [];
  db.exec({
    sql: "SELECT id, name FROM section WHERE id NOT IN (select distinct parent_id from section)",
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

  li.appendChild(img);
  li.appendChild(span);

  // Stick it at the front of the list
  let breadcrumbs = document.getElementById("pp-breadcrumbs");
  let firstChild = breadcrumbs.firstElementChild;
  breadcrumbs.insertBefore(li, firstChild);
}

function addBreadcrumbs(id){
  pushBreadcrumb(id);
  let parent_id = getParentId(id);
  while (parent_id > 0) {
    pushBreadcrumb(parent_id);
    parent_id = getParentId(parent_id);
  }
  if( id > 0) {
    pushBreadcrumb(0);
  }
}

function addTile(destination, name, imgURI, clickFunc, showMiniViewer) {
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
  img.partId = name.replace('part','');

  let cap = document.createElement("figcaption");
  cap.innerHTML = name;

  let fig = document.createElement("div");
  fig.classList.add("gallery-frame");
  fig.onclick = clickFunc;
  
  
  fig.appendChild(img);
  fig.appendChild(cap);
  gallery.appendChild(fig);
}


function addPartTile(name, url, imgURI) {
  addTile("gallery", name, imgURI, 
    function() { 
      document.getElementById("nav-overlay").style.width = "0vw"; 
      editPart(url);
    }, 
    true );
}

function addSectionTile(name, id, imgURI) {
  addTile("categories", name, imgURI, function() { buildSection(id);}, false);
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
   console.log(id);

  // Add the part tiles ( if any )
  db.exec({
    sql: `SELECT * FROM part INNER JOIN part_section ON part_section.part_id = part.id WHERE part_section.section_id = '${id}'`,
    rowMode: 'object',
    callback: function (row) {
      console.log(`{row.name} {row.id} {dir} {file}`);
      // Image directories are broken up into groups of 100
      let dir = String(Math.floor(parseInt(row.id) / 100)).padStart(3,'0')
      let file = String(parseInt(row.id) % 100).padStart(3,'0')
      addPartTile(row.name, `assets/local_scad/${dir}/${file}.scad`, `assets/part_images/${dir}/${file}.png`);
    }.bind({ counter: 0 })
  });
}
export function buildSearchResults(searchString) {
  clearGallery();

  // Show breadcrumbs
  addBreadcrumbs(0);

  let likeClause = searchString
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .map(word => { return '\'%' + word + '%\'' })
    .join(' OR name like ');
  console.log(likeClause);

  // Add the section tiles ( if any )
  db.exec({
    sql: `select * from part where name like ${likeClause} limit 30`,
    rowMode: 'object',
    callback: function (row) {
      // Image directories are broken up into groups of 100
      let dir = String(Math.floor(parseInt(row.id) / 100)).padStart(3,'0')
      let file = String(parseInt(row.id) % 100).padStart(3,'0')
      addPartTile(row.name, `assets/local_scad/${dir}/${file}.scad`, `assets/part_images/${dir}/${file}.png`);
    }.bind({ counter: c })
  });
}

export function buildGallery(_miniViewer, _renderPartFunc) {
  // Stash these as they only exist in main.js
  miniViewer = _miniViewer;
  renderPartFunc = _renderPartFunc;
  log("** Initializing sqlite database")
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
        log("** Building Gallery")
        buildSection(0);

        // Setup handler for the add part dialog
        setupAddPart(getSectionList());
      });
    } catch (e) {
      error("Exception:", e.message);
    }
  });
}