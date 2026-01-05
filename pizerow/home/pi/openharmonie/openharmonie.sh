#!/bin/bash

mqttpipe="/tmp/mqttpipe";

subscribe() {
if [[ ! -p "$mqttpipe" ]]; then
    touch $mqttpipe
fi
echo "Subscribe..."
(mosquitto_sub -h broker.home -t "devices/pi0w/harmonie" -u pi -P pi > $mqttpipe) & # 2>/dev/null) &
while true
do
    if [[ -f "$mqttpipe" ]]; then
        read line < $mqttpipe
    else
        echo "pipe not available anymore..."
        shutdown
    fi
    if [[ ! -z $line ]]
    then
        # Execute command in background
        # Otherwise mosquitto_sub could hang/crash if sending is not finished, but next command is already received
        (/home/pi/openharmonie/remotes/send_command.sh $line) &
        sleep .4 # Pause shortly to ignore too fast inputs
        : > $mqttpipe # Clear pipe
    fi
    sleep .1
done
}

watch() {
while true
do
    sleep 5
    if ! pgrep "mosquitto_sub" > /dev/null; then
        echo "mosquitto_sub not running anymore..."
        shutdown
    fi
done
}

shutdown() {
  echo "Shutdown..."
  rm $mqttpipe
  if pgrep "mosquitto_sub" > /dev/null; then
      pkill -9 mosquitto_sub 2>/dev/null;
  fi
  exit
}

trap shutdown SIGINT SIGTERM SIGKILL
subscribe & watch &

wait
