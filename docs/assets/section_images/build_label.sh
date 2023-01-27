#!/bin/bash

OSCDIR=$1
args=-Dfn=100 --render --colorscheme Parapart --autocenter --viewall --imgsize=512,512

for t in home containers brackets fasteners standoffs tools components gears wheels structural hooks nuts bolts miscellaneous electrical hinges boxes trays holders 8020 wedges blocks motion washers screws fans motors displays switches potentiometers connectors pin_barrel four_sides more_sides mechanical motion linear_slides bushings couplers bar_stock search_results
do
    scadfile="scad/$t.scad"
    if [ -f $scadfile ]
    then
        echo "$t SCAD exists!"
        $1/openscad $args $scadfile -o temp.png
        convert temp.png -transparent #cc00cc -geometry 128x128 $t.png
        rm temp.png
    else
        label=`echo $t | tr 'a-z' 'A-Z'`
        echo $label
        convert -size 128x128 -background grey -fill black -gravity center label:"$label" "$t".png
    fi
done
