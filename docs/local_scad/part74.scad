//[CUSTOMIZATION]
// Height
h=15;
// Radius 1
r1=7;
// Radius 2
r2=14;
// Message
txt="part74";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
