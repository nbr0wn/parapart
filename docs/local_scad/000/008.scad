//[CUSTOMIZATION]
// Height
h=6;
// Radius 1
r1=11;
// Radius 2
r2=5;
// Message
txt="part8";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
