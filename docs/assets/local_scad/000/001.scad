// ADDED BY:nbr0wn
// ADD DATE:2023-01-23
include <BOSL/constants.scad>
use <BOSL/metric_screws.scad>

/* [Parameters] */

// Bolt size
bolt_size = 10;

// Bolt length
bolt_length = 15;


module __END__ () {}



metric_bolt(size=bolt_size, l=bolt_length);
