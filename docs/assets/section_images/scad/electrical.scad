include <NopSCADlib/core.scad>
include <NopSCADlib/vitamins/toggles.scad>

include <NopSCADlib/utils/core/core.scad>
include <NopSCADlib/vitamins/stepper_motors.scad>
use <NopSCADlib/utils/layout.scad>

NEMA(NEMA17_27);

translate([-40,0,0])
toggle(AP5236, 3);