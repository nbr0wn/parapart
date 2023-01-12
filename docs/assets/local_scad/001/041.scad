//[CUSTOMIZATION]
// Height
h=14; // [10:100]
// Radius 1
r1=8; // [5,10,15]
// Radius 2
r2=9;
// Message
txt="part141";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
