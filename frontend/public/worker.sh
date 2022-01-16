#!/bin/bash
# This script will periodically retrieve new jobs from a box and execute it
# Be aware that this will EXECUTE COMMANDS COMING FROM A REMOTE SYSTEM ("BOX")
# It is advised to run this script in an isolated context like a VM or a container
# Usage: ./worker.sh <box_id>

set -e

if [ $# -eq 0 ]
  then
    echo "Please pass the box_id as an argument"
    exit
fi

# URL where new jobs are retrieve from and results are sent back to
box_url="http://localhost:8080/api/box/$1"
sleep_timer=10
stderr_log="hntr-worker.stderr.log"

log() {
    now="$(date +'%d/%m/%Y %T')"
    echo "[$now] $1"
}

while true
do
    log "checking for new jobs"

    # read jobs
    jobs=`curl -s $box_url/_dequeue | awk 'NF'`

    # execute job and send back result
    while read -r line
    do

        # skip empty lines
        [ -z "$line" ] && continue

        # extract job id and command
        id=$(echo $line | cut -d'#' -f1)
        cmd=$(echo $line | cut -d'#' -f2-)

        # execute command
        log "working on $id,cmd=$cmd"
        result=$(bash -c "$cmd" 2>> $stderr_log)

        # send back result
        answer=$(curl -s -H "Content-Type: text/plain" --data "$result" "$box_url/_results/$id")

        log "finished working on $id,answer=$answer"

    done < <(echo "$jobs")

    # sleep until new jobs arrive
    sleep $sleep_timer
done

