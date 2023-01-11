//[CUSTOMIZATION]
// X Dimension
xdim=8;
// Y Dimension
ydim=12;
// Z Dimension
zdim=20;
// Message
txt="part107";
module __END_CUSTOMIZATIONS () {}
cube(xdim,ydim,zdim);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
