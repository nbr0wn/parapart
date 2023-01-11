//[CUSTOMIZATION]
// Radius
rad=13;
// Message
txt="part38";
module __END_CUSTOMIZATIONS () { }
sphere(rad);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
