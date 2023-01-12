//[CUSTOMIZATION]
// X Dimension
xdim=16;
// Y Dimension
ydim=17;
// Z Dimension
zdim=13;
// Message
txt="part136";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
