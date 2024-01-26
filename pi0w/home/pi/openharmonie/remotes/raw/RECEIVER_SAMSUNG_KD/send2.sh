#!/bin/bash
ir-ctl -d /dev/lirc-tx --send=REMOTE_$1.txt
