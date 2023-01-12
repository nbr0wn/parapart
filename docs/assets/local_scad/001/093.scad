//[CUSTOMIZATION]
// Height
h=7; // [10:100]
// Radius 1
r1=13; // [5,10,15]
// Radius 2
r2=19;
// Message
txt="part193";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
