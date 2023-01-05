//[CUSTOMIZATION]
// Height
h=12;
// Radius
r1=6;
// Message
txt="part6";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r1);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
