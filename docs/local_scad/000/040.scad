//[CUSTOMIZATION]
// Height
h=6;
// Radius 1
r1=18;
// Radius 2
r2=15;
// Message
txt="part40";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
