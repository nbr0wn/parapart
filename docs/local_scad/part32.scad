//[CUSTOMIZATION]
// X Dimension
xdim=9;
// Y Dimension
ydim=15;
// Z Dimension
zdim=6;
// Message
txt="part32";
module __END_CUSTOMIZATIONS () {}
cube(xdim,ydim,zdim);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
