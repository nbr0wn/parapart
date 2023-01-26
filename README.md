# parapart

Parametric OpenSCAD part library
- Free
- Fast
- Open source
- No signups/logins/ads to download parts
- 100% static - Hosted by GitHub and runs in the browser


GitHub Pages site:
https://parapart.com


## What is this thing?
I found myself constantly running into situations where I needed to 3D print some small
part, but I couldn't find an STL, or if I did, it was not quite right and needed to be 
modified.  I had not to date seen a 3D model site that did this quickly and efficiently,
so I decided to write one.

This site is intended to be a fast, free repository of customizable OpenSCAD models with STL export. No logins or signups to download models, no ads.  Everything is statically hosted on GitHub.  Customization is done using the OpenSCAD customizer functionality.

## What is it not?
Parapart is not intended to be a replacement for thingiverse, thangs, or any of the other excellent model repositories out there.  Parapart is intended to be a repository of components for makers to use while building their fabulous projects, or for anyone with a 3D printer to quickly download and print that one type of hook that nobody makes.

## How does it work?

Parapart uses a WebAssembly version of OpenSCAD,and OpenSCAD's built-in customization handling as described in the wiki:

https://en.wikibooks.org/wiki/OpenSCAD_User_Manual/Customizer

This allows the openSCAD file to remain portable and does not require any external parameter
files to be maintained.  The functionality here is meant to mimic OpenSCAD's built-in
customizer.

For the part database, Parapart loads a static database file and uses the WASM version of Sqlite.

## I have SCAD files - how do I get them in here?

Instructions are here: https://github.com/nbr0wn/parapart/wiki

## Shout outs to those who laid the foundation for this project

Whoo...I did some serious shoulder climbing for this one.  Many thanks to Olivier Chafik, whose opencad-wasm editor project was the foundation of this effort:

https://github.com/ochafik/openscad-wasm/tree/editor-ochafik.com

Olivier's openscad-wasm build is a fork of Dominick Schroer's openscad-wasm project, which I'm using in place of Olivier's since it was updated a little more recently:

https://github.com/DSchroer/openscad-wasm

Olivier's project also made use of the most excellent viewstl:

https://www.viewstl.com
https://github.com/omrips/viewstl

...and the monaco editor:
https://github.com/microsoft/monaco-editor

Because I wanted this site to be served from GitHub and hosted statically, I needed a way 
to manage the part library without a server.  I landed on including a sqlite 
database in the distribution and using sqlite WASM to query it:

https://sqlite.org/wasm/doc/trunk/index.md

...and of course the OpenSCAD project itself
https://openscad.org


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


See https://openscad.org/libraries.html for license details 


## Known Issues
- General code cleanup

## Wish List
- Help files per part
- Having the ability to link related parts and possibly use the same customizations
