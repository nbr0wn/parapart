//[CUSTOMIZATION]
// Radius
rad=7;
// Message
txt="part36";
module __END_CUSTOMIZATIONS () { }
sphere(rad);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
