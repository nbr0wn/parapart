//[CUSTOMIZATION]
// Height
h=13; // [5,10,20]
// Radius
r1=6; // [20]
// Message
txt="part42";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r1);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
