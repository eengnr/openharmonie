#!/bin/bash

if [[ -z $1 ]]
    then
        echo "No key was given"
        exit
fi

CMD=$1

if [[ "$CMD" = "REMOTE_POWER" ]]
    then
        # Preflight code 0xa6a7
        # Power multiple times
        for i in {1..2}; do
            ir-ctl -d /dev/lirc-tx -k /home/pi/openharmonie/remotes/toml/BLURAY_PLAYER_PIONEER.toml -K REMOTE_PREFLIGHT -K $CMD --gap 20000
            sleep 0.125 #125000 ms, default for --gap of ir-ctl, but because of the preflight, a loop is used here
        done
elif [[ "$CMD" = "REMOTE_OPENCLOSE" ]] || [[ "$CMD" = "REMOTE_HOMEMEDIAGALLERY" ]] || [[ "$CMD" = "REMOTE_KEYLOCK" ]] || [[ "$CMD" = "REMOTE_DIMMER" ]] || [[ "$CMD" = "REMOTE_EXIT" ]] || [[ "$CMD" = "REMOTE_CDSACD" ]] || [[ "$CMD" = "REMOTE_TOPMENU" ]] || [[ "$CMD" = "REMOTE_POPUPMENU" ]] || [[ "$CMD" = "REMOTE_HOMEMENU" ]] || [[ "$CMD" = "REMOTE_RETURN" ]] || [[ "$CMD" = "REMOTE_REPLAY" ]] || [[ "$CMD" = "REMOTE_TOOLS" ]] || [[ "$CMD" = "REMOTE_CONTINUED" ]] || [[ "$CMD" = "REMOTE_SKIPSEARCH" ]] || [[ "$CMD" = "REMOTE_REWIND" ]] || [[ "$CMD" = "REMOTE_PLAY" ]] || [[ "$CMD" = "REMOTE_FORWARD" ]] || [[ "$CMD" = "REMOTE_SKIPBACK" ]] || [[ "$CMD" = "REMOTE_PAUSE" ]] || [[ "$CMD" = "REMOTE_STOP" ]] || [[ "$CMD" = "REMOTE_SKIPNEXT" ]] || [[ "$CMD" = "REMOTE_AUDIO" ]] || [[ "$CMD" = "REMOTE_SUBTITLE" ]] || [[ "$CMD" = "REMOTE_ANGLE" ]] || [[ "$CMD" = "REMOTE_AB" ]] || [[ "$CMD" = "REMOTE_PROGRAM" ]] || [[ "$CMD" = "REMOTE_BOOKMARK" ]] || [[ "$CMD" = "REMOTE_ZOOM" ]] || [[ "$CMD" = "REMOTE_INDEX" ]]
    then
        # Preflight code 0xa6a7
        ir-ctl -d /dev/lirc-tx -k /home/pi/openharmonie/remotes/toml/BLURAY_PLAYER_PIONEER.toml -K REMOTE_PREFLIGHT -K $CMD --gap 20000
elif [[ "$CMD" = "REMOTE_NETCONTENTS" ]] || [[ "$CMD" = "REMOTE_MICVOLUMEUP" ]] || [[ "$CMD" = "REMOTE_MICVOLUMEDOWN" ]] || [[ "$CMD" = "REMOTE_VIRTUALSOUND" ]] || [[ "$CMD" = "REMOTE_SOUND" ]] || [[ "$CMD" = "REMOTE_SOUNDRETRIEVER" ]] || [[ "$CMD" = "REMOTE_USBREC" ]] || [[ "$CMD" = "REMOTE_UP" ]] || [[ "$CMD" = "REMOTE_LEFT" ]] || [[ "$CMD" = "REMOTE_RIGHT" ]] || [[ "$CMD" = "REMOTE_DOWN" ]]
    then
        # Preflight code 0xa6a0
        # Correct keys with duplicate codes
        if [[ "$CMD" = "REMOTE_SOUNDRETRIEVER" ]]
            then
                CMD="REMOTE_POPUPMENU"
        elif [[ "$CMD" = "REMOTE_UP" ]]
            then
                CMD="REMOTE_AB"
        fi
        ir-ctl -d /dev/lirc-tx -k /home/pi/openharmonie/remotes/toml/BLURAY_PLAYER_PIONEER.toml -K REMOTE_PREFLIGHT2 -K $CMD --gap 20000
elif [[ "$CMD" = "REMOTE_TV_POWER" ]] || [[ "$CMD" = "REMOTE_TV_CHANNELUP" ]] || [[ "$CMD" = "REMOTE_TV_VOLUMEUP" ]] || [[ "$CMD" = "REMOTE_TV_INPUT" ]] || [[ "$CMD" = "REMOTE_TV_CHANNELDOWN" ]] || [[ "$CMD" = "REMOTE_TV_VOLUMEDOWN" ]]
    then
        # TV controls
        ir-ctl -d /dev/lirc-tx -k /home/pi/openharmonie/remotes/toml/BLURAY_PLAYER_PIONEER.toml -K $CMD --gap 20000
else
    ir-ctl -d /dev/lirc-tx -k /home/pi/openharmonie/remotes/toml/BLURAY_PLAYER_PIONEER.toml -K $CMD -K $CMD --gap 10000
fi
