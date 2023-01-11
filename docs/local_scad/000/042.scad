//[CUSTOMIZATION]
// Height
h=6;
// Radius 1
r1=17;
// Radius 2
r2=18;
// Message
txt="part42";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
