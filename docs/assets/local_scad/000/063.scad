//[CUSTOMIZATION]
// X Dimension
xdim=9;
// Y Dimension
ydim=13;
// Z Dimension
zdim=14;
// Message
txt="part63";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
