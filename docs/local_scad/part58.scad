//[CUSTOMIZATION]
// Height
h=10;
// Radius 1
r1=20;
// Radius 2
r2=16;
// Message
txt="part58";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
