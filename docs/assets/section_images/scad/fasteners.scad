
include <NopSCADlib/core.scad>
include <NopSCADlib/vitamins/nuts.scad>
include <NopSCADlib/vitamins/screws.scad>
include <NopSCADlib/vitamins/washers.scad>

translate([10,20,0])
washer(M8_penny_washer);

translate([20,-10,20])
screw(M8_cap_screw, length=30, show_threads=true);


nut(M8_nut, show_threads = true);

