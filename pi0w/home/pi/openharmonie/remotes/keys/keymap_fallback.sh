#!/bin/bash

declare -A keymap_fallback

keymap_fallback["KEY_POWER"]="26" # KEYCODE_POWER
keymap_fallback["KEY_SEARCH"]="84" # KEYCODE_SEARCH
keymap_fallback["KEY_LEFT"]="21" # KEYCODE_DPAD_LEFT
keymap_fallback["KEY_UP"]="19" # KEYCODE_DPAD_UP
keymap_fallback["KEY_RIGHT"]="22" # KEYCODE_DPAD_RIGHT
keymap_fallback["KEY_DOWN"]="20" # KEYCODE_DPAD_DOWN
keymap_fallback["KEY_KPENTER"]="23" # KEYCODE_DPAD_CENTER
keymap_fallback["KEY_BACK"]="4" # KEYCODE_BACK
keymap_fallback["KEY_HOMEPAGE"]="3" # KEYCODE_HOME
keymap_fallback["KEY_MENU"]="82" # KEYCODE_MENU
keymap_fallback["KEY_REWIND"]="89" # KEYCODE_MEDIA_REWIND
keymap_fallback["KEY_PLAYPAUSE"]="85" # KEYCODE_MEDIA_PLAY_PAUSE
keymap_fallback["KEY_FASTFORWARD"]="90" # KEYCODE_MEDIA_FAST_FORWARD
keymap_fallback["KEY_MUTE"]="91" # KEYCODE_MUTE
keymap_fallback["KEY_VOLUMEUP"]="24" # KEYCODE_VOLUME_UP
keymap_fallback["KEY_VOLUMEDOWN"]=""25 # KEYCODE_VOLUME_DOWN
keymap_fallback["KEY_PROGRAM"]="3" # doesn't have an equivalent, but doesn't work anyways
keymap_fallback["KEY_CHANNELUP"]="166" # KEYCODE_CHANNEL_UP
keymap_fallback["KEY_CHANNELDOWN"]="167" # KEYCODE_CHANNEL_DOWN