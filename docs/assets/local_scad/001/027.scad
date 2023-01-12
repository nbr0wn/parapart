//[CUSTOMIZATION]
// Radius
rad=5;
// Message
txt="part127";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () { }
sphere(rad);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
