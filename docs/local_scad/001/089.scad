//[CUSTOMIZATION]
// Radius
rad=14;
// Message
txt="part189";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () { }
sphere(rad);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
