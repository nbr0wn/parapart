//[CUSTOMIZATION]
// X Dimension
xdim=11;
// Y Dimension
ydim=17;
// Z Dimension
zdim=7;
// Message
txt="part78";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () {}
cube([xdim,ydim,zdim]);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }