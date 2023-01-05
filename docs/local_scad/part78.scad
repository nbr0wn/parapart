//[CUSTOMIZATION]
// Height
h=19;
// Radius 1
r1=19;
// Radius 2
r2=12;
// Message
txt="part78";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
