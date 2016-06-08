#!/bin/bash
USER=${COUCHDB_USERNAME:-couchdb}
PASS=${COUCHDB_PASSWORD:-$(pwgen -s -1 16)}
DB=${COUCHDB_DBNAME:-"sofia-fiches"}
GENERATE_TEST_DATA=${SOFIA_TEST:-0}

PORT=5984
HOST=http://$USER:$PASS@127.0.0.1:$PORT

# Start CouchDB service
/usr/local/bin/couchdb -b
while ! nc -vz 127.0.0.1 $PORT; do sleep 1; done

sleep 5s;

# Create User
echo "Creating user: \"$USER\"..."
curl -X PUT http://127.0.0.1:$PORT/_config/admins/$USER -d '"'${PASS}'"'
echo "Applying secu on database: \"_users\"..."
curl -X PUT -d '{"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":["_admin"]}}' $HOST/_users/_security
echo "Applying secu on database: \"_replicator\"..."
curl -X PUT -d '{"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":["_admin"]}}' $HOST/_replicator/_security

echo "Adding _design/sofia to _users (for listing ...)"
curl -X PUT -d "{ \"views\": {\"username\": {\"map\": \"function(doc){ if (doc.name) { emit(doc._id, doc.name); } }\"}}, \"lists\": { \"users\": \"function(head, req) { provides('json', function() { var results = []; while (row = getRow()) {results.push(row.value)} send(JSON.stringify(results)); }); }\" } }" $HOST/_users/_design/sofia

#TODO use a better solution because it will pop-up a http basic even for _session
#echo "Applying secu on global database: ..."
#curl -X PUT -d "\"true\"" $HOST/_config/couch_httpd_auth/require_valid_user

echo "Enabling CORS on global database: ..."
curl -X PUT $HOST/_config/httpd/enable_cors -d '"true"'
curl -X PUT $HOST/_config/cors/origins -d '"*"'
curl -X PUT $HOST/_config/cors/credentials -d '"true"'
curl -X PUT $HOST/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
curl -X PUT $HOST/_config/cors/headers -d '"accept, authorization, content-type, origin, referer, x-csrf-token"'

# Create Database
if [ ! -z "$DB" ]; then
    echo "Creating database: \"$DB\"..."
    curl -X PUT $HOST/$DB
    echo "Applying secu on database: \"$DB\"..."
    curl -X PUT -d '{"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":["equipier"]}}' $HOST/$DB/_security

    echo "Uploading default config in database: \"$DB\"..."
    curl -X PUT -H "Content-Type:text/html" --data-binary "<h2>Hello World</h2>" "$HOST/$DB/_design/sofia-config/memo.html"

    echo "Compacting database $DB"
    curl -X POST  -H 'Content-Type: application/json' $HOST/$DB/_compact
fi

# Create Admin App Database
(cd / && /bin/bash scripts/install-admin-app.sh $HOST "sofia-admin" )
# Create Web App Database
(cd / && /bin/bash scripts/install-web-app.sh $HOST "sofia-app" )

# Create sample user (equipier)
if [ ! -z "$GENERATE_TEST_DATA" ]; then
    for i in $(eval echo "{1..$GENERATE_TEST_DATA}")
    do
        U="Team$i"
        P=$(pwgen -s -1 6)
        echo "Creating team (équipier): \"$U\", with password : \"$P\"..."
        curl --silent -X PUT -H 'Content-Type: application/json' $HOST/_users/org.couchdb.user:$U -d "\
            {\"_id\": \"org.couchdb.user:$U\", \
            \"name\": \"$U\", \
            \"type\": \"user\", \
            \"roles\": [\"equipier\"], \
            \"password\": \"$P\" \
        }" 2>/dev/null > /dev/null
    done
fi

echo "Compacting database _users ..."
curl -X POST  -H 'Content-Type: application/json' $HOST/_users/_compact

sleep 3s
# Stop CouchDB service
/usr/local/bin/couchdb -d

echo "========================================================================"
echo "CouchDB User: \"$USER\""
echo "CouchDB Password: \"$PASS\""
if [ ! -z "$DB" ]; then
    echo "CouchDB Database: \"$DB\""
fi
echo "========================================================================"

rm -f /.firstrun
