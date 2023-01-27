// ADDED BY:test_user
// ADD DATE:2023-01-27
include <NopSCADlib/core.scad>
include <NopSCADlib/vitamins/pulleys.scad>
include <NopSCADlib/utils/layout.scad>

/* [Customization] */

// Pulley Type
pulleyType= "GT2x16_pulley" ;//[ 0:GT2x16_pulley, 1:GT2x16_toothed_idler, 2:GT2x20_toothed_idler, 3:GT2x20_plain_idler, 4:GT2x16_plain_idler, 5:GT2x16x7_plain_idler, 6:GT2x20ob_pulley, 7:GT2x12_pulley, 8:GT2x20um_pulley, 9:T2p5x16_pulley, 10:T5x10_pulley ]


module __END__ () {}

pulley(pulleys[pulleyType]);