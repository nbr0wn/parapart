//[CUSTOMIZATION]
// Height
h=15;
// Radius 1
r1=5;
// Radius 2
r2=9;
// Message
txt="part12";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
