//[CUSTOMIZATION]
// X Dimension
xdim=18;
// Y Dimension
ydim=5;
// Z Dimension
zdim=16;
// Message
txt="part150";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
