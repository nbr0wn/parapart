//[CUSTOMIZATION]
// Height
h=8;
// Radius
r1=18;
// Message
txt="part22";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r1);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }