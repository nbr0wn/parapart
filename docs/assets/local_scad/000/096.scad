//[CUSTOMIZATION]
// Height
h=13; // [10:100]
// Radius 1
r1=16; // [5,10,15]
// Radius 2
r2=17;
// Message
txt="part96";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
