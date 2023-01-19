#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

PROCESSOR=$SCRIPT_DIR/target/debug/parapart_processor
DB=$SCRIPT_DIR/../database
DOCS=$SCRIPT_DIR/../docs

cd $SCRIPT_DIR
if [ ! -f "github_token" ]
then
    echo "github_token missing from $SCRIPT_DIR"
    exit 1
fi

set -x

while [ true ];
do
    cd $SCRIPT_DIR
    $PROCESSOR -t github_token -p .. -o ../../openscad/openscad
    base64 $DB/parapart.sqlite3 > $DOCS/db.base64

    cd $DOCS
    git add assets/local_scad
    git add assets/part_images
    git add assets/local_stl
    git add db.base64
    git commit -m "Auto part add"
    git push

    sleep 300
done
