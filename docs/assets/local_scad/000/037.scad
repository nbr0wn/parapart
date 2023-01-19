// ADDED BY:nbr0wn
// ADD DATE:2023-01-19
/*
 * Copyright 2021 Code and Make (codeandmake.com)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * Hinge by Code and Make (https://codeandmake.com/)
 *
 * https://codeandmake.com/post/fully-customizable-hinge
 *
 * Hinge v1.0 (27 May 2021)
 */

/* [General] */

// Thickness of the material
Material_Thickness = 2.5; // [1:0.5:10]

// Amount of material to remove from gap points
Gap_Percent = 20; // [5:1:50]

/* [Leaves] */

// Length of each leaf (X axis)
Leaf_Length = 60; // [10:0.1:200]

// Width of each leaf (Y axis)
Leaf_Width = 30; // [10:0.1:100]

/* [Knuckles] */

// Total number of knuckles
Knuckles = 11; // [3:2:39]

// Use if you need up to 270 degrees of rotation
Large_Knuckle_Recesses = 0; //[0: No, 1: Yes]

/* [Screws] */

// Number of screw holes per leaf
Screw_Holes_Per_Leaf = 4; // [2:1:10]

// The diameter of the screw hole
Screw_Hole_Diameter = 4; // [2:0.1:10]

// The diameter of the screw head
Screw_Head_Diameter = 8; // [3:0.1:20]

// Screw countersink angle (82 and 90 are common)
Screw_Head_Countersink_Angle = 90; // [0:0.1:180]

/* [Preview Only] */

// Part(s) to show in preview mode
Part = 0; // [0: Both, 1: Pin Leaf, 2: Sleeve Leaf]

// Rotation of sleeve leaf in preview mode
Sleeve_Leaf_Rotation = 0; // [-90:1:180]

module hinge() {

  gap = (Material_Thickness * Gap_Percent / 100);
  sections = (Knuckles - 1) / 2;
  sectionLength = Leaf_Length / Knuckles;
  screwDiameter = max(Screw_Hole_Diameter, Screw_Head_Diameter);

  module leaf() {
    difference() {
      union() {
        translate([0, gap, -Material_Thickness]) {
          cube(size=[Leaf_Length, Leaf_Width - gap - Material_Thickness, Material_Thickness - gap]);
        }

        hull() {
          translate([Leaf_Length - Material_Thickness, Leaf_Width - Material_Thickness, -Material_Thickness]) {
            intersection() {
              cube(size=[Material_Thickness, Material_Thickness, Material_Thickness - gap]);
              cylinder(r = Material_Thickness, h = Material_Thickness - gap);
            }
          }

          translate([Material_Thickness, Leaf_Width - Material_Thickness, -Material_Thickness]) {
            intersection() {
              translate([-Material_Thickness, 0, 0]) {
                cube(size=[Material_Thickness, Material_Thickness, Material_Thickness - gap]);
              }
              cylinder(r = Material_Thickness, h = Material_Thickness - gap);
            }
          }
        }
      }

      // core
      rotate([0, 90, 0]) {
        cylinder(d = Material_Thickness + gap, h = Leaf_Length);
      }
    }
  }

  module sleeveLeafKnuckleNotches() {
    for (i=[0:sections]) {
      translate([sectionLength * i * 2, 0, 0]) {
        sectionLengthPlusGap = sectionLength + gap;
        translate([-gap / 2, 0, 0]) {
          rotate([0, 90, 0]) {
              if(Large_Knuckle_Recesses) {
              translate([-((Material_Thickness + gap) * 2) / 2, -((Material_Thickness + gap) * 2) / 2, 0]) {
                cube(size=[(Material_Thickness + gap) * 2, (Material_Thickness + gap) * 2, sectionLengthPlusGap]);
              }
            } else {
              cylinder(d = (Material_Thickness + gap) * 2, h = sectionLengthPlusGap);
            }
          }
        }
      }
    }
  }

  module pinLeafKnuckleNotches() {
    for (i=[0:sections - 1]) {
      translate([sectionLength + (i * (sectionLength * 2)), 0, 0]) {
        sectionLengthPlusGap = sectionLength + gap;
        translate([-gap / 2, 0, 0]) {
          rotate([0, 90, 0]) {
            if(Large_Knuckle_Recesses) {
              translate([-((Material_Thickness * 2) + gap) / 2, -((Material_Thickness * 2) + gap) / 2, 0]) {
                cube(size=[(Material_Thickness * 2) + gap, (Material_Thickness * 2) + gap, sectionLengthPlusGap]);
              }
            } else {
              cylinder(d = (Material_Thickness * 2) + gap, h = sectionLengthPlusGap);
            }
          }
        }
      }
    }
  }

  module pinKnuckles() {
    for (i=[0:sections]) {
      translate([sectionLength * i * 2, 0, 0]) {
        sectionLengthMinusGap = sectionLength - (i != sections ? gap : gap / 2) + (i == 0 ? gap / 2 : 0);
        
        translate([(i != 0 ? gap / 2 : 0), 0, 0]) {
          rotate([0, 90, 0]) {
            cylinder(d = Material_Thickness * 2, h = sectionLengthMinusGap);
          }
          translate([0, 0, -Material_Thickness]) {
            cube(size=[sectionLengthMinusGap, gap, Material_Thickness - gap]);
          }
        }
      }
    }

    // core
    rotate([0, 90, 0]) {
      cylinder(d = Material_Thickness - gap, h = Leaf_Length);
    }
  }

  module sleeveKnuckles() {
    difference() {
      for (i=[0:sections - 1]) {
        translate([sectionLength + (i * (sectionLength * 2)), 0, 0]) {
          sectionLengthMinusGap = sectionLength - (i != sections ? gap : gap / 2);
          
          translate([gap / 2, 0, 0]) {
            rotate([0, 90, 0]) {
              cylinder(d = Material_Thickness * 2, h = sectionLengthMinusGap);
            }
            translate([0, 0, -Material_Thickness]) {
              cube(size=[sectionLengthMinusGap, gap, Material_Thickness - gap]);
            }
          }
        }
      }

      // core
      rotate([0, 90, 0]) {
        cylinder(d = Material_Thickness + gap, h = Leaf_Length);
      }
    }
  }

  module screwHole() {
    translate([0, 0, -Material_Thickness]) {
      translate([0, 0, -0.5]) {
        cylinder(d = (Screw_Head_Countersink_Angle ? Screw_Hole_Diameter : screwDiameter), h = Material_Thickness + 1);
      }

      if(Screw_Head_Countersink_Angle) {
        countersinkHeight = tan((180 - (Screw_Head_Countersink_Angle)) / 2) * (Screw_Head_Diameter / 2);
        translate([0, 0, Material_Thickness - countersinkHeight]) {
          cylinder(d2 = Screw_Head_Diameter, d1 = 0, h = countersinkHeight);
        }
      }

      translate([0, 0, Material_Thickness - 0.005]) {
        cylinder(d = screwDiameter, h = 1);
      }
    }
  }

  module screwHoles(flip) {
    minY = Material_Thickness + gap + (screwDiameter / 2);
    maxY = Leaf_Width - (screwDiameter / 2);
    YSpacing = (maxY - minY) / 4;

    minX = (screwDiameter / 2);
    maxX = Leaf_Length - (screwDiameter / 2);
    XSpacing = (maxX - minX) / Screw_Holes_Per_Leaf;

    for (i=[0:Screw_Holes_Per_Leaf - 1]) {
      translate([minX + (XSpacing * i) + (XSpacing / 2), minY + (YSpacing * (1 + (((i + (flip ? 1 : 0)) % 2) * 2))), -gap]) {
        screwHole();
      }
    }
  }

  module pinLeaf() {
    difference() {
      leaf();
      pinLeafKnuckleNotches();
      screwHoles();
    }
    pinKnuckles();
  }

  module sleeveLeaf() {
    rotate([($preview ? -Sleeve_Leaf_Rotation : 0), 0, 0]) {
      mirror([0, 1, 0]) {
        difference() {
          leaf();
          sleeveLeafKnuckleNotches();
          screwHoles(true);
        }
        sleeveKnuckles();
      }
    }
  }

  if(!$preview || Part == 0 || Part == 1) {
    pinLeaf();
  }
  if(!$preview || Part == 0 || Part == 2) {
    sleeveLeaf();
  }
}

hinge();