//[CUSTOMIZATION]
// X Dimension
xdim=19;
// Y Dimension
ydim=11;
// Z Dimension
zdim=13;
// Message
txt="part37";
module __END_CUSTOMIZATIONS () {}
cube(xdim,ydim,zdim);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
