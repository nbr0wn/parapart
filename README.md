# parapart
Parametric OpenSCAD part designer


## What is this thing?
I found myself constantly running into situations where I needed to 3D print some small
part, but I couldn't find it, or if I did, it was not quite right and needed to be 
modified.  I had not to date seen a 3D model site that does this adequately, so...here we are.

This site is not meant for complex multi-part models, or for selling designs.  It is for people
who just want to grab a quick part and print it.  No logins, no signups, no ads.  OpenSCAD
was a good fit for this.

https://openscad.org


Parapart uses OpenSCAD's built-in parameter handling as described in the wiki:

https://en.wikibooks.org/wiki/OpenSCAD_User_Manual/Customizer

This allows the openSCAD file to remain portable and does not require any external parameter
files to be maintained.  The functionality here is meant to mimic OpenSCAD's built-in
customizer.

## How did I get here?

Whoo...I went shoulder climbing for this one.  Many thanks to Olivier Chafik, whose opencad-wasm project was the foundation of this effort:

https://github.com/ochafik/openscad-wasm/tree/editor-ochafik.com


Olivier's project is a fork of Dominick Schroer's openscad-wasm build, which I'm using in place of Olivier's since it was updated a little more recently:

https://github.com/DSchroer/openscad-wasm

Because I wanted this site to be served from GitHub and hosted statically, I needed a way 
to keep the part library up to date without a server.  I landed on including a sqlite 
database in the distribution.  To use this in the site, I used the sqlite WASM build 
from sqlite itself:

https://sqlite.org/wasm/doc/trunk/index.md


Olivier kindly included the following OpenSCAD libraries in his distribution, which I have aldo carried forward:

- BOSL2
- BOSL
- closepoints
- fonts
- FunctionalOpenSCAD
- funcutils
- MCAD
- NopSCADlib
- openscad-tray
- plot-function
- smooth-prim
- Stemfie_OpenSCAD
- UB.scad
- YAPP_Box

