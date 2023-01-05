//[CUSTOMIZATION]
// X Dimension
xdim=17;
// Y Dimension
ydim=18;
// Z Dimension
zdim=18;
// Message
txt="part25";
module __END_CUSTOMIZATIONS () {}
cube(xdim,ydim,zdim);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
