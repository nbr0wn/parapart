//[CUSTOMIZATION]
// X Dimension
xdim=9;
// Y Dimension
ydim=5;
// Z Dimension
zdim=5;
// Message
txt="part35";
module __END_CUSTOMIZATIONS () {}
cube(xdim,ydim,zdim);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
