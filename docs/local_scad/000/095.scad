//[CUSTOMIZATION]
// Height
h=16;
// Radius
r1=14;
// Message
txt="part95";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r1);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
