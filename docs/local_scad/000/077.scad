//[CUSTOMIZATION]
// X Dimension
xdim=16;
// Y Dimension
ydim=14;
// Z Dimension
zdim=18;
// Message
txt="part77";
module __END_CUSTOMIZATIONS () {}
cube(xdim,ydim,zdim);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
