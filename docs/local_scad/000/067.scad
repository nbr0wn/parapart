//[CUSTOMIZATION]
// X Dimension
xdim=11;
// Y Dimension
ydim=18;
// Z Dimension
zdim=19;
// Message
txt="part67";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
