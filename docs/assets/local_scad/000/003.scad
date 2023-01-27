// ADDED BY:nbr0wn
// ADD DATE:2023-01-27
/* [Params] */

// Length
length = 40;

// Width
width = 40;

// Height
height = 20;

// Thickness
thick=2;

module __END__ () {}

difference() {
cube([length,width,height], center=true);
translate([0,0,thick]) cube([length-thick, width-thick, height], center=true);
}