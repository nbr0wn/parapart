//[CUSTOMIZATION]
// X Dimension
xdim=11;
// Y Dimension
ydim=8;
// Z Dimension
zdim=17;
// Message
txt="part68";
module __END_CUSTOMIZATIONS () {}
cube(xdim,ydim,zdim);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
