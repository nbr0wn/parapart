//[CUSTOMIZATION]
// Height
h=16;
// Radius 1
r1=11;
// Radius 2
r2=20;
// Message
txt="part12";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
