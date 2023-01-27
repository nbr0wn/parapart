include <NopSCADlib/core.scad>
include <NopSCADlib/vitamins/pulleys.scad>
include <NopSCADlib/vitamins/shaft_couplings.scad>
include <NopSCADlib/vitamins/rails.scad>

rail(HGH15CA,200);
carriage(HGH15CA_carriage);
translate([0,-50,0])
shaft_coupling(SC_5x8_rigid);
translate([0,50,0])
    pulley(GT2x16_pulley);