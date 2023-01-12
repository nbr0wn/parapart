//[CUSTOMIZATION]
// Radius
rad=17;
// Message
txt="part3";
// I love it
boolvar=true;
module __END_CUSTOMIZATIONS () { }
sphere(rad);
translate([20,20,20]) { linear_extrude(5) text(txt, font="Liberation Sans"); }
