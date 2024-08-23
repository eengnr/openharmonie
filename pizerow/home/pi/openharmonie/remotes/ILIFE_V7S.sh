#!/bin/bash

if [[ -z $1 ]]
    then
        echo "No key was given"
        exit
fi
ir-ctl -d /dev/lirc-tx -k /home/pi/openharmonie/remotes/toml/ILIFE_V7S.toml -K $1
