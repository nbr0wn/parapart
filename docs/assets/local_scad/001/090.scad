//[CUSTOMIZATION]
// X Dimension
xdim=17;
// Y Dimension
ydim=7;
// Z Dimension
zdim=11;
// Message
txt="part190";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }