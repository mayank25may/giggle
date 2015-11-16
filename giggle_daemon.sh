#!/bin/bash
echo $@
nohup python giggle.py $@ > out.log 2>&1 </dev/null &