//[CUSTOMIZATION]
// X Dimension
xdim=19;
// Y Dimension
ydim=14;
// Z Dimension
zdim=6;
// Message
txt="part64";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
