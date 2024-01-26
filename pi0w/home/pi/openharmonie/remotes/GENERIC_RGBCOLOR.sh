#!/bin/bash

if [[ -z $1 ]]
    then
        echo "No key was given"
        exit
fi
ir-ctl -d /dev/lirc-tx -k /home/pi/openharmonie/remotes/toml/GENERIC_RGBCOLOR.toml -K $1
