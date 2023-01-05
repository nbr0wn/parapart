//[CUSTOMIZATION]
// Height
h=11;
// Radius
r1=20;
// Message
txt="part20";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r1);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
