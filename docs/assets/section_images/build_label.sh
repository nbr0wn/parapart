#!/bin/bash

OSCDIR=$1
args="-Dfn=100 --render --colorscheme Parapart --autocenter --viewall --imgsize=512,512"

# Process a single file using scad if it exists or generating a label image if not
process_file () {
    label=`echo $1 | tr 'a-z' 'A-Z'`
    scadfile="scad/$1.scad"
    if [ -f $scadfile ]
    then
        echo "HAVE SCAD FOR $label"
        $1/openscad $args $scadfile -o temp.png
        convert temp.png -transparent "#cc00cc" -geometry 128x128 $1.png
        rm temp.png
    else
        echo "NO SCAD FOR $label"
        convert -size 128x128 -background grey -fill black -gravity center label:"$label" "$1".png
    fi
}

# Just do one if it was passed in on the cmdline
if [ ! -z "$2" ]
then
    echo "SECOND ARG"
    process_file $2
    exit 0
fi

# Generate the whole works
for t in 8020 bar_stock blocks bolts boxes brackets bushings components connectors containers couplers displays electrical fans fasteners four_sides gears hinges holders home hooks linear_slides mechanical miscellaneous more_sides motion motion motors nuts pin_barrel potentiometers screws search_results standoffs structural switches tools trays washers wedges wheels
do
    process_file $t
done
