#!/bin/bash

source "/home/pi/openharmonie/remotes/keys/keymap.sh"

KEY=${keymap[$1]}

if [[ "$KEY" != "" ]]; then
  ssh linux "YDOTOOL_SOCKET=/tmp/.ydotool ydotool key $KEY:1 $KEY:0"
fi
