#!/bin/bash

# Load keymaps
source "/home/pi/openharmonie/remotes/keys/keymap.sh"
source "/home/pi/openharmonie/remotes/keys/keymap_fallback.sh"

# Constants
readonly FIRETV_HOST="firetv.home"
readonly BT_HELPER_DEVICE="/dev/picow"

# Files to persist possible inputs
readonly INPUT_AMZKEYBOARD="/tmp/amzkeyboard"
readonly INPUT_FIRETVREMOTE="/tmp/firetvremote"

if [[ "$1" = "REMOTE_CONNECT" ]]
    then
        # Connect ADB
        adb connect "$FIRETV_HOST":5555 > /dev/null 2>&1
        # Init possible input variables
        adb shell getevent -lp 2> /dev/null | grep -B 1 -F "amzkeyboard" | grep -o \/dev.*event.*$ > "$INPUT_AMZKEYBOARD"
        adb shell getevent -lp 2> /dev/null | grep -B 1 -F "Amazon Fire TV Remote" | grep -o \/dev.*event.*$ > "$INPUT_FIRETVREMOTE"
        # Connect BT keyboard
        if [[ -e "$BT_HELPER_DEVICE" ]];
            then
                echo -e $1 > "$BT_HELPER_DEVICE"
        fi
elif [[ "$1" = "REMOTE_DISCONNECT" ]]
    then
        # Disconnect ADB
        adb disconnect > /dev/null
        rm "$INPUT_AMZKEYBOARD"
        rm "$INPUT_FIRETVREMOTE"
        adb kill-server > /dev/null
        # Disconnect BT keyboard
        if [ -e "$BT_HELPER_DEVICE" ];
            then
                echo -e $1 > "$BT_HELPER_DEVICE"
        fi
elif [[ "$1" = *"REMOTE_APP_"* ]]
    then
        ACTIVITY=""
    case "$1" in
        "REMOTE_APP_DISNEY")
            ACTIVITY="com.disney.disneyplus/com.bamtechmedia.dominguez.main.MainActivity";;
        "REMOTE_APP_NETFLIX")
            ACTIVITY="com.netflix.ninja/.MainActivity";;
        "REMOTE_APP_JOYN")
            ACTIVITY="de.prosiebensat1digital.seventv/.MainActivity";;
        "REMOTE_APP_RTLPLUS")
            ACTIVITY="de.cbc.tvnow.firetv/de.rtli.everest.activity.SplashActivity";;
        "REMOTE_APP_ZDF")
            ACTIVITY="com.zdf.android.mediathek/.ui.splash.SplashActivity";;
        "REMOTE_APP_ARD")
            ACTIVITY="de.swr.ard.avp.mobile.android.amazon/.TvActivity";;
        "REMOTE_APP_NEWPIPE")
            ACTIVITY="org.schabi.newpipe/.MainActivity";;
        "REMOTE_APP_YOUTUBE")
            ACTIVITY="com.google.android.youtube.tv/com.google.android.apps.youtube.tv.activity.ShellActivity";;
        "REMOTE_APP_AMAZONVIDEO")
            ACTIVITY="com.amazon.avod/.playbackclient.FireTvPlaybackActivity";;
        "REMOTE_APP_AMAZONMUSIC")
            ACTIVITY="com.amazon.bueller.music/com.amazon.music.MainActivity";;
        "REMOTE_APP_APPLETV")
            ACTIVITY="com.apple.atve.amazon.appletv/.MainActivity";;
        "REMOTE_APP_ARTE")
            ACTIVITY="tv.arte.plus7/.leanback.MainActivity";;
        "REMOTE_APP_FREEVEE")
            ACTIVITY="com.amazon.imdb.tv.android.app/.LandingPageActivity";;
    esac
    if [[ ! -z "$ACTIVITY" ]]
        then
            adb shell am start -a android.intent.action.VIEW -n "$ACTIVITY" > /dev/null
    fi
else
    # Try to use BT keyboard
    # If BT keyboard is not available, use `sendevent` to `amzkeyboard`
    # If `amzkeyboard` is not available, use `Amazon Fire TV Remote`
    # If `Amazon Fire TV Remote` is not available, use `input keyevent`
    # Get the input device, we already persisted it when the adb connection was established
    if [[ -e "$BT_HELPER_DEVICE" ]];
        then
            echo -e $1 > "$BT_HELPER_DEVICE"
    else
        read -r INPUT < "$INPUT_AMZKEYBOARD"
        if [[ -z "$INPUT" ]]
            then
                read -r INPUT < "$INPUT_FIRETVREMOTE"
        fi
        if [[ ! -z "$INPUT" ]]
            then
                KEY=${keymap[$1]}
                # adb shell sendevent input event_type key action
                # event_types see https://github.com/torvalds/linux/blob/master/include/uapi/linux/input-event-codes.h
                # action 1 = DOWN, 0 = UP
                adb shell sendevent "$INPUT" 1 "$KEY" 1
                adb shell sendevent "$INPUT" 0 0 0
                adb shell sendevent "$INPUT" 1 "$KEY" 0
                adb shell sendevent "$INPUT" 0 0 0
        else
                KEY=${keymap_fallback[$1]}
                # event codes see https://developer.android.com/reference/android/view/KeyEvent
                adb shell input keyevent $KEY
        fi
        # Check if Fire TV remote is still available
        adb shell getevent -lp 2> /dev/null | grep -B 1 -F "Amazon Fire TV Remote" | grep -o \/dev.*event.*$ > "$INPUT_FIRETVREMOTE"
    fi
fi
