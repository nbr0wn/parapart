#!/bin/bash
set -x

BUILD=.
BASE=../docs

. $BUILD/github_token.txt

while [ true ];
do
    cd $BUILD
    $BUILD/gh_check
    base64 $BUILD/parapart.sqlite3 > $BASE/parapart.sqlite3

    cd $BASE
    git add assets/local_scad
    git add assets/part_images
    git add assets/local_stl
    git add parapart.sqlite3
    git commit -m "Auto part add"
    git push

    sleep 300
done
