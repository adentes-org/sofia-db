#!/bin/bash
#Install sofia web couchapp

HOST=$1
APP_DB=$2
TMP_FILE=/tmp/upload-webapp-data
#ID=$(curl -X GET $HOST/$APP_DB/_design/sofia-app | cut -d"\"" -f8)

function encodeFile() {
    #echo $1
    openssl base64 < "web-app/www/$1" | tr '\n' ' ';
}
function addFile() {
    #$1:file $2:type $3:tmpFile
    echo "   \"$1\": {
       \"content_type\": \"$2\",
       \"data\": \"$(encodeFile $1)\"
    }," >> $3
}
echo "deleting any existing database: \"$APP_DB\"..."
curl -X DELETE $HOST/$APP_DB

echo "Creating database: \"$APP_DB\"..."
curl -X PUT $HOST/$APP_DB
echo "Applying secu on database: \"$APP_DB\"..."
curl -X PUT -d '{"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":[]}}' $HOST/$APP_DB/_security
curl -X PUT -d '{ "language": "javascript", "validate_doc_update": "function(newDoc, oldDoc, userCtx, secObj) { throw({forbidden: \"Change forbidden.\"});}"}' $HOST/$APP_DB/_design/_auth

echo "Getting webapp..."

git clone https://github.com/adentes-org/SOFIA.git "web-app/"

echo "Uploading files ..."
echo "{\"_attachments\": { " > $TMP_FILE

fileList="index.html";
for file in $fileList
do
   addFile "$file" "text/html" "$TMP_FILE"
done
fileList="assets/img/logo.png";
for file in $fileList
do
   addFile "$file" "image/png" "$TMP_FILE"
done

sed -i '$ s/.$//' $TMP_FILE
echo "  }
}" >> $TMP_FILE

curl -X PUT $HOST/$APP_DB/_design/sofia-app -H 'Content-Type: application/json' -d "@$TMP_FILE"
