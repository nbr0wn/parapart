//[CUSTOMIZATION]
// Height
h=20; // [10:100]
// Radius 1
r1=7; // [5,10,15]
// Radius 2
r2=18;
// Message
txt="part43";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }