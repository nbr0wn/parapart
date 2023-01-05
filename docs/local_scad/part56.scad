//[CUSTOMIZATION]
// Height
h=5;
// Radius 1
r1=11;
// Radius 2
r2=16;
// Message
txt="part56";
module __END_CUSTOMIZATIONS () { }
cylinder(h,r1,r2);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
