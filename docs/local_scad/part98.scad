//[CUSTOMIZATION]
// Radius
rad=15;
// Message
txt="part98";
module __END_CUSTOMIZATIONS () { }
sphere(rad);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
