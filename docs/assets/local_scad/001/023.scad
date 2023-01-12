//[CUSTOMIZATION]
// X Dimension
xdim=8;
// Y Dimension
ydim=20;
// Z Dimension
zdim=5;
// Message
txt="part123";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
