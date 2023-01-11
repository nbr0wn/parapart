//[CUSTOMIZATION]
// X Dimension
xdim=11;
// Y Dimension
ydim=8;
// Z Dimension
zdim=14;
// Message
txt="part174";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
