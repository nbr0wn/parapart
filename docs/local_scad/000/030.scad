//[CUSTOMIZATION]
// X Dimension
xdim=19;
// Y Dimension
ydim=17;
// Z Dimension
zdim=10;
// Message
txt="part30";
module __END_CUSTOMIZATIONS () {}
cube(xdim,ydim,zdim);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
