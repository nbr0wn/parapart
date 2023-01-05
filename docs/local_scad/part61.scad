//[CUSTOMIZATION]
// X Dimension
xdim=19;
// Y Dimension
ydim=13;
// Z Dimension
zdim=15;
// Message
txt="part61";
module __END_CUSTOMIZATIONS () {}
cube(xdim,ydim,zdim);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
