//[CUSTOMIZATION]
// Height
h=19;
// Radius 1
r1=9;
// Radius 2
r2=17;
// Message
txt="part104";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
