#!/bin/bash

if [[ -z $1 ]]
    then
        echo "No key was given"
        exit
fi
# Add sleeps to avoid missed signals
sleep .05
ir-ctl -d /dev/lirc-tx --send=/home/pi/openharmonie/remotes/raw/RECEIVER_SAMSUNG_KD/$1.txt 2> /dev/null
sleep .1
