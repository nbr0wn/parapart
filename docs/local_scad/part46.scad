//[CUSTOMIZATION]
// Height
h=5;
// Radius
r1=18;
// Message
txt="part46";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r1);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
