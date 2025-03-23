#!/bin/bash

if [[ -z $1 ]]
    then
        echo "No key was given"
        exit
fi
ir-ctl -d /dev/lirc-tx --send=/home/pi/openharmonie/remotes/raw/RECEIVER_SAMSUNG_KD/$1.txt 2> /dev/null
if [[ "$1" == "REMOTE_POWER" ]]
then
	ir-ctl -d /dev/lirc-tx --send=/home/pi/openharmonie/remotes/raw/RECEIVER_SAMSUNG_KD/$1.txt 2> /dev/null
	ir-ctl -d /dev/lirc-tx --send=/home/pi/openharmonie/remotes/raw/RECEIVER_SAMSUNG_KD/$1.txt 2> /dev/null
fi
