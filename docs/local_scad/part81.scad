//[CUSTOMIZATION]
// X Dimension
xdim=10;
// Y Dimension
ydim=16;
// Z Dimension
zdim=17;
// Message
txt="part81";
module __END_CUSTOMIZATIONS () {}
cube(xdim,ydim,zdim);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
