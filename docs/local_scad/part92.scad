//[CUSTOMIZATION]
// X Dimension
xdim=20;
// Y Dimension
ydim=18;
// Z Dimension
zdim=9;
// Message
txt="part92";
module __END_CUSTOMIZATIONS () {}
cube(xdim,ydim,zdim);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
