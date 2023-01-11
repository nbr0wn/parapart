//[CUSTOMIZATION]
// X Dimension
xdim=16;
// Y Dimension
ydim=9;
// Z Dimension
zdim=5;
// Message
txt="part183";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
