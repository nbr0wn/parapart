//[CUSTOMIZATION]
// X Dimension
xdim=14;
// Y Dimension
ydim=14;
// Z Dimension
zdim=13;
// Message
txt="part40";
module __END_CUSTOMIZATIONS () {}
cube(xdim,ydim,zdim);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
