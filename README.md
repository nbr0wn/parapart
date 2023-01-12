# parapart
Parametric OpenSCAD part library


## What is this thing?
I found myself constantly running into situations where I needed to 3D print some small
part, but I couldn't find it, or if I did, it was not quite right and needed to be 
modified.  I had not to date seen a 3D model site that does this adequately, and I've
never seen the Thingiverse customizer actually work, so...here we are.

This site is intended to be a free repository of customizable OpenSCAD models with STL export. No logins, no signups, no ads.  Everything is statically hosted on GitHub, and is available for free to anyone.

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
SECTION: <Pick one number from the list below>

[Containers]         [Hinges]               [Components]
1100 Four Sides      5100 Barrel            10100 Fans
1100 More Sides                             10200 Motors
                     6000 Gears             10300 Displays
2000 Brackets        7000 Wheels            10400 Power Supplies
2100 Hooks                                  10500 Switches
                     [Mechanical]           10600 Potentiometers
3000 Fasteners       8100 Motion            10700 Connectors
3100 Nuts            8110 Linear Slides     
3200 Bolts           8120 Bushings          [Structural]
3300 Washers         8130 Couplers          9100 8020
                                            9200 Bar Stock
11000 Miscellaneous
12000 Tools


[Optional]
HELPURL:<help file name> - Name of markdown file that resides at the same path as the part file

Anything after HELPURL may be read, but will not be processed as part of the part, and will not 
wind up on the parapart interactive site

'''
Examples:
'''
NAME:Hexagonal Box
URL:https://github.com/nbr0wn/mypartlib/blob/main/path/to/hexbox.scad
SECTION: 1100
HELP:hexbox.md

NAME:Octagonal Box
URL:https://github.com/nbr0wn/mypartlib/blob/main/path/to/octbox.scad
SECTION: 1100
'''

Include as many parts as you like per issue.  Empty lines will be ignored

### Raw SCAD files
If you just have a SCAD file that you don't have hosted on GitHub and you would like to include it, create an issue with the title 'SCAD' and then just include the file.  This will be added as a local file to the parapart repository.

## How did I get here?

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
- Currently the libraries load several times per execution. This is obviously wasteful
- CSS needs a lot of work
- URL handling for sharing part links 
- General code cleanup
- Help files are not yet properly processed

## Wish List
- Having the ability to link related parts and possibly use the same customizations
