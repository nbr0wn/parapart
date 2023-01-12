//[CUSTOMIZATION]
// Height
h=13; // [10:100]
// Radius 1
r1=11; // [5,10,15]
// Radius 2
r2=5;
// Message
txt="part120";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
