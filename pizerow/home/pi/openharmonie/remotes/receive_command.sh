#!/bin/bash
mosquitto_pub -h broker.home -t "devices/oh/harmonie" -u pi -P pi -m "$1"
