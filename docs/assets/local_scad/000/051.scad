// ADDED BY:test_user
// ADD DATE:2023-01-27
// ADDED BY: test
// ADD DATE:2023-01-23
include <BOSL2/std.scad>
include <BOSL2/gears.scad>

/* [Parameters] */

// Gear Pitch
gear_pitch = 20;

// Number of Teeth
gear_teeth = 20;

// Thickness
gear_thickness = 8;

// Shaft Diameter
shaft=5;



module __END__ () {}


spur_gear(pitch=gear_pitch, teeth=gear_teeth, thickness=gear_thickness, shaft_diam=shaft);