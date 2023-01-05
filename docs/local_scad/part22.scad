//[CUSTOMIZATION]
// Height
h=18;
// Radius
r1=10;
// Message
txt="part22";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r1);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
