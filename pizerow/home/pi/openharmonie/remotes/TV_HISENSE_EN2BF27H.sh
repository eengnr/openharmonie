#!/bin/bash

if [[ -z $1 ]]
    then
        echo "No key was given"
        exit
fi
ir-ctl -d /dev/lirc-tx -k /home/pi/openharmonie/remotes/toml/TV_HISENSE_EN2BF27H.toml -K $1
