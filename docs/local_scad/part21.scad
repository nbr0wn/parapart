//[CUSTOMIZATION]
// Height
h=11;
// Radius 1
r1=15;
// Radius 2
r2=19;
// Message
txt="part21";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
