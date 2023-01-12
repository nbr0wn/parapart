//[CUSTOMIZATION]
// X Dimension
xdim=7;
// Y Dimension
ydim=19;
// Z Dimension
zdim=6;
// Message
txt="part44";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
