//[CUSTOMIZATION]
// Height
h=12; // [5,10,20]
// Radius
r1=15; // [20]
// Message
txt="part10";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r1);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }