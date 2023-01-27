
module fan_wheel(
    outer_radius    = 55,    
    inner_radius    = 15,
    blade_count     = 8,
    outer_width     = 50,
    inner_width     = 20,
    thickness       = 2,    
    twist           = -30,    
    angle_of_attack = 45,
){

    module blade() {

        inner_height = 
            cos( 
                asin( inner_width / ( 2 * inner_radius ) ) 
            ) * inner_radius;
        
        blade_height = outer_radius - inner_height;

        angle = 
            atan( 
                  ( ( outer_width / 2 * cos( abs( twist ) ) ) - 
                    ( inner_width / 2 ) 
                  ) / blade_height 
            );    
        
        height = sin( abs( twist ) ) * outer_width / 2 + 
                 thickness;
        
        width = outer_width / 2 - inner_width / 2;
        
        depth  = 
            sqrt( 
                pow( ( outer_width / 2 * cos( abs( twist ) ) ) - 
                     ( inner_width / 2 ), 2 ) + 
                pow( blade_height, 2 )
            ) + thickness;
            
        blade_divisions = 10;
            
        difference(){
            intersection(){
                rotate( [0, -angle_of_attack, 0] )
                difference(){
                    translate( [0, inner_height, 0] )
                    rotate( [-90, 0, 0] )
                    linear_extrude( 
                        height    = blade_height, 
                        twist     = twist, 
                        slices    = 10 , 
                        convexity = 10
                    ) 
                    translate([
                        -outer_width / 2,
                        -thickness / 2
                    ])
                    polygon( concat(
                        [for (i = [0 : blade_divisions]) 
                            [i * outer_width / blade_divisions, (i % 2) * 0.0001]
                        ],
                        [for (i = [blade_divisions : -1 : 0]) 
                            [i * outer_width / blade_divisions, 
                             thickness + (i % 2) * 0.0001]
                        ]
                    ));
                    
                                                
                    for (i = [0 : 1])
                    mirror( [i, 0, 0] )
                    translate([
                        inner_width / 2,
                        inner_height,
                        -height
                    ])
                    rotate( [0, 0, -angle] )
                    translate( [0, -depth / 2, 0] )
                    cube( [width * 2, depth * 1.5, 2 * height] );

                }
                
                translate( [0, 0, -height] )
                cylinder( 
                    r = outer_radius, 
                    h = 2 * height, 
                    $fn = 100
                );
            }
            
            translate( [0, 0, -height] )
            cylinder( r = inner_radius, h = 2 * height, $fn = 50);            
        }
    }

    // hub
    hub_height = 
        sin( abs( angle_of_attack ) ) * inner_width / 2 + 
        thickness;
    
    translate( [0, 0, -hub_height] )
    cylinder( r = inner_radius, h = hub_height * 2, $fn = 50);

    // blades
    for(i = [0 : 360 / blade_count : 359])
    rotate( [0, 0, i] )
    blade();

}

fan_wheel();

/*
// upper half
intersection() {
    fan_wheel();
    
    translate([-100,-100,0])
    cube([200,200,100]);
}

// lower half
translate([120,0,0])
rotate([180,0,0])
intersection() {
    fan_wheel();
    
    translate([-100,-100,-100])
    cube([200,200,100]);
}

*/
