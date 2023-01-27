
difference() {
    union() { 
        cube(20,true);
        translate([0,0,10]) {
            union() {
                scale([0.8, 0.8, 0.8]) {
                    rotate([0,0,45]) {
                        cylinder(20,20,00,$fn=4);
                    }
                }
            }
        }
    };
    translate([-4, -12, -10]) {
        cube(size=[7,10,10],center=false);
    }
}