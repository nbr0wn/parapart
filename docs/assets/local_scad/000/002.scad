// ADDED BY:nbr0wn
// ADD DATE:2023-01-27
include <tray.scad>

/* [Settings] */

// Width of the tray
width = 100;
// Length of the tray
length = 60;
// Height of the tray
height = 20;

// How many rows of dividers
rows = 3;

// How many dividers in each row. Only uses as many values as you have rows
slots_per_row=[2,2,4,1]; //[1:6]

module __END__ () {}

tray([length,width,height], n_rows=rows, n_columns=slots_per_row, rows_first = true);