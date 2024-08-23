#!/bin/bash
sleep .1
mosquitto_pub -h broker.home -t "devices/oh/harmonie" -u pi0w -P pi0w -m "$1"
