#!/bin/bash
for t in home containers brackets fasteners standoffs tools components gears wheels structural hooks nuts bolts
do
    label=`echo $t | tr 'a-z' 'A-Z'`
    echo $label
    convert -size 128x128 -background grey -fill black -gravity center label:$label $t.png
done
