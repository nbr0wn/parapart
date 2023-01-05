//[CUSTOMIZATION]
// Height
h=9;
// Radius
r1=16;
// Message
txt="part55";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r1);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
