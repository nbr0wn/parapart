//[CUSTOMIZATION]
// Height
h=17;
// Radius
r1=8;
// Message
txt="part162";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r1);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
