//[CUSTOMIZATION]
// X Dimension
xdim=15;
// Y Dimension
ydim=13;
// Z Dimension
zdim=20;
// Message
txt="part147";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }