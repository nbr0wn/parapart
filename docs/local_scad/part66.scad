//[CUSTOMIZATION]
// Height
h=13;
// Radius 1
r1=5;
// Radius 2
r2=6;
// Message
txt="part66";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
