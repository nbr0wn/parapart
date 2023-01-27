include <tray.scad>


difference() {
cube([40,40,20], center=true);
translate([0,0,4]) cube([38,38,20], center=true);
}

translate([0,50,10]) rotate([90,0,0])
difference() {
cylinder(r=40, h=30, $fn=6);
translate([0,0,4]) cylinder(r=38, h=28, $fn=6);
}
translate([70,45,80]) rotate([180,90,0])

tray([100,60,20], n_rows=3, n_columns=[2,2,3], rows_first = true);
