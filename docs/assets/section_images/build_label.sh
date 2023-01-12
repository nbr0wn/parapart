#!/bin/bash
for t in home containers brackets fasteners standoffs tools components gears wheels structural hooks nuts bolts miscellaneous electrical hinges boxes trays holders 8020 wedges blocks motion washers screws fans motors displays switches potentiometers connectors pin_barrel four_sides more_sides mechanical motion linear_slides bushings couplers bar_stock
do
    label=`echo $t | tr 'a-z' 'A-Z'`
    echo $label
    convert -size 128x128 -background grey -fill black -gravity center label:"$label" "$t".png
done
