//[CUSTOMIZATION]
// Radius
rad=9;
// Message
txt="part46";
module __END_CUSTOMIZATIONS () { }
sphere(rad);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
