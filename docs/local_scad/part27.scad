//[CUSTOMIZATION]
// X Dimension
xdim=7;
// Y Dimension
ydim=11;
// Z Dimension
zdim=15;
// Message
txt="part27";
module __END_CUSTOMIZATIONS () {}
cube(xdim,ydim,zdim);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
