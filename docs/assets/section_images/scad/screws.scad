include <BOSL2/std.scad>
include <BOSL2/screws.scad>
$fn=32;
xdistribute(spacing=8){
  screw("M3", head="flat small",length=12);
  screw("M3", head="button",drive="torx",length=12);
  screw("M3", head="pan", drive="phillips",length=12);
  screw("M3x1", head="pan", drive="slot",length=12);   // Non-standard threading!
  screw("M3", head="flat large",length=12);
  screw("M3", thread="none", head="flat", drive="hex",length=12);  // No threads
  screw("M3", head="socket",length=12);
  screw("M5,18", head="hex");
}