//[CUSTOMIZATION]
// X Dimension
xdim=14;
// Y Dimension
ydim=10;
// Z Dimension
zdim=18;
// Message
txt="part77";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }