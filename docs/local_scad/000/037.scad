//[CUSTOMIZATION]
// Height
h=19;
// Radius
r1=15;
// Message
txt="part37";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r1);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
