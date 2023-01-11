//[CUSTOMIZATION]
// X Dimension
xdim=19;
// Y Dimension
ydim=16;
// Z Dimension
zdim=18;
// Message
txt="part1";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
