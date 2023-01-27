//Customizable Combination Wrench 
//

//Change these constants for other sizes/etc. All measurements in mm.

size=4; //ideally between 2-50

height=2; //4;  3 for size<=6;

length=10*size; // 5*size; 60 for size>=10

insert=0; //thickness of any additional material which will be used in the ends. Leave 0 if not attempting to strengthen.

box_offset = 0; // .4*(height-1);
box_rot=0; // -15 default

/////////////////////////////////////

////////////////////////////////////////

union(){

difference(){
shaft();
translate([(length+size),0,-0.15*height])
union(){
rotate([0,0,15])
linear_extrude(2*height+1)
circle(size+insert,$fn=6);
rotate([0,0,105])
linear_extrude(2*height+1)
circle(size+insert,$fn=6);
rotate([0,0,195])
linear_extrude(2*height+1)
circle(size+insert,$fn=6);
}

}

//smaller sizes l+1.4size, -.15height
//bigger l+1.2size, 0.1height
translate([(length+1.4*size),0,-0.15*height])
box_end();

translate([-1.1*size,0,0.01*height])
open_end();
}


//////////////////////////////////////////////////
module open_end(){
translate([0,0,-0.25*(height+2)])
difference(){
linear_extrude(2*height+1)
//smaller sizes +3
//>10 +5
circle(size+insert+3);

union(){
rotate([0,0,15])
linear_extrude(2*height+1)
circle(size+insert,$fn=6);

linear_extrude(2*height+1)
//small sizes -2* and -1.4*
//bigger/default -1.5* and -1.305*
translate([-2*size,-1.4*size,0])
rotate([0,0,15])
square(1.75*(size+insert));

linear_extrude(2*height+1)
translate([-1.5*size,-1.305*size,0])
rotate([0,0,15])
square(1.75*(size+insert));
}
}
}
////////////////////////////////////////////////////
module box_end(){

translate([0,0,box_offset])
rotate([0,box_rot,0])
difference(){
linear_extrude(2*height+1)
//smaller +3, bigger +3.5
circle(size+insert+3);

union(){
rotate([0,0,15])
linear_extrude(2*height+1)
circle(size+insert,$fn=6);
rotate([0,0,105])
linear_extrude(2*height+1)
circle(size+insert,$fn=6);
rotate([0,0,195])
linear_extrude(2*height+1)
circle(size+insert,$fn=6);

}
}
}
///////////////////////////////////////////////////////////////
module shaft(){
minkowski(){
cube([length, size, height]);
translate([0,-size/2,size/8])
rotate([0,90,0])
cylinder(r=height/2,h=1,$fn=8);
}
}
/////////////////////////////////////////////
module cleanup(){
translate([length-2,-size+2,-(height+2)])
cube([size+2,size+2,3*(height+2)]);
}