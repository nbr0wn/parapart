//[CUSTOMIZATION]
// Height
h=12; // [10:100]
// Radius 1
r1=14; // [5,10,15]
// Radius 2
r2=16;
// Message
txt="part55";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
