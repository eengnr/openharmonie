#!/bin/bash
if [[ -z $1 ]]
    then
        echo "No key was given"
        exit
fi
ir-ctl -d /dev/lirc-tx -k /home/pi/openharmonie/remotes/toml/TV_TELEFUNKEN_QU50K800.toml -K $1
if [[ "$1" == "REMOTE_POWER" ]]
then
    sleep 0.075
    ir-ctl -d /dev/lirc-tx -k /home/pi/openharmonie/remotes/toml/TV_TELEFUNKEN_QU50K800.toml -K $1
fi
