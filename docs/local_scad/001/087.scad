//[CUSTOMIZATION]
// X Dimension
xdim=10;
// Y Dimension
ydim=6;
// Z Dimension
zdim=18;
// Message
txt="part187";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
