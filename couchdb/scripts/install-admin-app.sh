#!/bin/bash
#Install sofia admin couchapp

HOST=$1
ADMIN_DB=$2
TMP_FILE=/tmp/upload-data
#ID=$(curl -X GET $HOST/$ADMIN_DB/_design/sofia-admin | cut -d"\"" -f8)

function encodeFile() {
    #echo $1
    openssl base64 < "$1" | tr '\n' ' ';
}
function addFile() {
    #$1:file $2:type $3:tmpFile
    echo "Adding ($2) : $1"
    echo "   \"$1\": {
       \"content_type\": \"$2\",
       \"data\": \"$(encodeFile $1)\"
    }," >> $3
}

export -f encodeFile
export -f addFile
export TMP_FILE

echo "deleting any existing database: \"$ADMIN_DB\"..."
curl -X DELETE $HOST/$ADMIN_DB

echo "Creating database: \"$ADMIN_DB\"..."
curl -X PUT $HOST/$ADMIN_DB
echo "Applying secu on database: \"$ADMIN_DB\"..."
curl -X PUT -d '{"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":[]}}' $HOST/$ADMIN_DB/_security
curl -X PUT -d '{ "language": "javascript", "validate_doc_update": "function(newDoc, oldDoc, userCtx, secObj) { throw({forbidden: \"Change forbidden.\"});}"}' $HOST/$ADMIN_DB/_design/_auth

#echo "Deleting any old file in DB"
#curl -X DELETE $HOST/$ADMIN_DB/_design/sofia-admin?rev=$(curl -X GET $HOST/$ADMIN_DB/_design/sofia-admin | cut -d"\"" -f8)

echo "Uploading files ..."
echo "{\"_attachments\": { " > $TMP_FILE
#$(openssl base64 < "admin-app/$file" | tr '\n' ' ')

cd admin-app
addFile index.html "text/html" "$TMP_FILE"
addFile stats.html "text/html" "$TMP_FILE"
addFile style.css  "text/css" "$TMP_FILE"
addFile script.js  "application/javascript" "$TMP_FILE"

find lib -type f -name '*.css' -exec  bash -c 'addFile "$0" "text/css" "$TMP_FILE"' {} \;
find lib -type f -name '*.png' -exec  bash -c 'addFile "$0" "image/png" "$TMP_FILE"' {} \;
find lib -type f -name '*.js' -exec  bash -c 'addFile "$0" "application/javascript" "$TMP_FILE"' {} \;

sed -i '$ s/.$//' "$TMP_FILE"
echo "  }
}" >> "$TMP_FILE"
cd ..
#cat /tmp/upload-data

curl -X PUT $HOST/$ADMIN_DB/_design/sofia-admin -H 'Content-Type: application/json' -d "@$TMP_FILE"

rm "$TMP_FILE"

echo "Compacting database $ADMIN_DB"
curl -X POST  -H 'Content-Type: application/json' $HOST/$ADMIN_DB/_compact

echo "Admin app avalaible at : /$ADMIN_DB/_design/sofia-admin/index.html"
