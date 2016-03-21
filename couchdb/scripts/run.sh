#!/bin/bash

# Initialize first run
if [[ -e /.firstrun ]]; then
    echo "Init DB"
    /scripts/first_run.sh
fi

if [ $# -gt 1 ]; then
    echo "Entering cli mode"
    #If we have args (to be run in exec mode)
    if [ $1 -eq "add-user" ]; then
    	  /scripts/add-user.sh $2 $3
    else
        echo "Usage: add-user <username> [<userpass>]"
    fi
    exit
fi


# Start CouchDB
echo "Starting CouchDB..."
/usr/local/bin/couchdb
