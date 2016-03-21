#!/bin/bash
#If we have args add action is add-user
# You need to set USER and PASS as env var
# TODO detect and supprot not running mode
if [ $# -gt 0  ]; then
            if [ -z "$USER" ]; then read -p "Admin username : " USER; fi
            if [ -z "$PASS" ]; then read -p "Admin password : " PASS; fi
            HOST=http://$USER:$PASS@127.0.0.1:5984
            U=$1
            P=${2:-"$(pwgen -s -1 6)"}
            echo "Creating team (équipier): \"$U\", with password : \"$P\"..."
            curl --silent -X PUT -H 'Content-Type: application/json' $HOST/_users/org.couchdb.user:$U -d "\
                {\"_id\": \"org.couchdb.user:$U\", \
                \"name\": \"$U\", \
                \"type\": \"user\", \
                \"roles\": [\"equipier\"], \
                \"password\": \"$P\" \
            }"
else
   echo "Usage: add-user <username> [<userpass>]"
fi

