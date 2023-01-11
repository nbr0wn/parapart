//[CUSTOMIZATION]
// X Dimension
xdim=8;
// Y Dimension
ydim=17;
// Z Dimension
zdim=6;
// Message
txt="part71";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
