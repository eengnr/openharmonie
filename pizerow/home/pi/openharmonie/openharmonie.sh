#!/bin/bash

mqttpipe="/tmp/mqttpipe";

subscribe() {
if [[ ! -p "$mqttpipe" ]]; then
    mkfifo $mqttpipe
fi
echo "Subscribe..."
(mosquitto_sub -h broker.home -t "devices/pi0w/harmonie" -u pi0w -P pi0w > $mqttpipe) & # 2>/dev/null) &
while read line <$mqttpipe
do
    # Execute command in background
    # Otherwise mosquitto_sub could hang/crash if sending is not finished, but next command is already received
    (/home/pi/openharmonie/remotes/send_command.sh $line) &
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
    if [[ ! -p "$mqttpipe" ]]; then
        echo "pipe not available anymore..."
        shutdown
    fi
done
}

shutdown() {
  echo "Shutdown..."
  rm $mqttpipe
  if pgrep "mosquitto_sub" > /dev/null; then
      kill $(pidof mosquitto_sub) 2>/dev/null;
  fi
  exit
}

trap shutdown SIGINT SIGTERM SIGKILL
subscribe & watch &

wait
