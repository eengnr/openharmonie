#!/bin/bash

if [[ -z $1 ]]
    then
        echo "No key was given"
        exit
fi
ir-ctl -d /dev/lirc-tx -k /home/pi/openharmonie/remotes/toml/HDMI_SWITCH_3.toml -K $1 -K $1
