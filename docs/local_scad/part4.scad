//[CUSTOMIZATION]
// Height
h=13;
// Radius
r1=12;
// Message
txt="part4";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r1);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
