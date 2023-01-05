# parapart
Parametric OpenSCAD part designer


## What is this thing?
I found myself constantly running into situations where I needed to 3D print some small
part, but I couldn't find it, or if I did, it was not quite right and needed to be 
modified.  I had not to date seen a 3D model site that does this adequately, and I've
never seen the Thingiverse customizer actually work, so...here we are.

This site is not meant for complex multi-part models, or for selling designs.  It is for people
who just want to grab a quick part, customize it, and print it.  No logins, no signups, no ads.  
OpenSCAD was a good fit for this.

https://openscad.org

Parapart uses OpenSCAD's built-in customization handling as described in the wiki:

https://en.wikibooks.org/wiki/OpenSCAD_User_Manual/Customizer

This allows the openSCAD file to remain portable and does not require any external parameter
files to be maintained.  The functionality here is meant to mimic OpenSCAD's built-in
customizer.

## I have SCAD files - how do I get them in here?
For now, I'm just going to use GitHub for this rather than hosting a separate site for adding parts.  I didn't want to deal with user accounts etc. at this point, so it seemed like a reasonable way to get things moving.

### Files hosted on GitHub
Create an issue with the title 'PARTS'

https://github.com/nbr0wn/parapart/issues/new

The format is:
'''
[Required]
NAME:<name of part> - 32 char limit
URL:<url of part file> - Currently only GitHub-hostted SCAD files are supported here

[Optional]
HELPURL:<help file name> - Name of markdown file that resides at the same path as the part file
'''

Examples:
'''
NAME:Hexagonal Box
URL:https://github.com/nbr0wn/mypartlib/blob/main/path/to/hexbox.scad
HELP:hexbox.md

NAME:Octagonal Box
URL:https://github.com/nbr0wn/mypartlib/blob/main/path/to/octbox.scad
'''

Include as many parts as you like per issue.  Empty lines will be ignored

### Raw SCAD files
If you just have a SCAD file that you don't have hosted on GitHub and you would like to include it, create an issue with the title 'SCAD' and then just include the file.  This will be added as a local file to the parapart repository.

https://github.com/nbr0wn/parapart/issues/new


## How did I get here?

Whoo...I did some serious shoulder climbing for this one.  Many thanks to Olivier Chafik, whose opencad-wasm editor project was the foundation of this effort:

https://github.com/ochafik/openscad-wasm/tree/editor-ochafik.com

Olivier's openscad-wasm build is a fork of Dominick Schroer's openscad-wasm project, which I'm using in place of Olivier's since it was updated a little more recently:

https://github.com/DSchroer/openscad-wasm

Olivier's project also made use of the most excellent viewstl:

https://www.viewstl.com
https://github.com/omrips/viewstl


Because I wanted this site to be served from GitHub and hosted statically, I needed a way 
to manage the part library without a server.  I landed on including a sqlite 
database in the distribution and using sqlite WASM to query it:

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


See https://openscad.org/libraries.html for license details 


## Known Issues
- Currently the libraries load several times per execution. This is obviously wasteful
- CSS needs a lot of work
- URL handling for sharing part links 
- General code cleanup
- Help files are not yet properly processed

## Wish List
- Having the ability to link related parts and possibly use the same customizations
