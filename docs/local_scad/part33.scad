//[CUSTOMIZATION]
// Height
h=15;
// Radius
r1=13;
// Message
txt="part33";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r1);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
