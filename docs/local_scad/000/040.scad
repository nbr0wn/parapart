//[CUSTOMIZATION]
// Height
h=6;
// Radius
r1=8;
// Message
txt="part40";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r1);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
