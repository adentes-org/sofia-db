#!/bin/bash
#Install sofia web couchapp

HOST=$1
APP_DB=$2
TMP_FILE=/tmp/upload-webapp-data
#ID=$(curl -X GET $HOST/$APP_DB/_design/sofia-app | cut -d"\"" -f8)

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

echo "deleting any existing database: \"$APP_DB\"..."
curl -X DELETE $HOST/$APP_DB

echo "Creating database: \"$APP_DB\"..."
curl -X PUT $HOST/$APP_DB
echo "Applying secu on database: \"$APP_DB\"..."
curl -X PUT -d '{"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":[]}}' $HOST/$APP_DB/_security
curl -X PUT -d '{ "language": "javascript", "validate_doc_update": "function(newDoc, oldDoc, userCtx, secObj) { throw({forbidden: \"Change forbidden.\"});}"}' $HOST/$APP_DB/_design/_auth

echo "Getting webapp..."

git clone https://github.com/adentes-org/SOFIA.git "web-app/" && cd web-app 
#npm install && bower-installer && gulp 
#cd www
git checkout gh-pages

echo "Uploading files ..."
echo "{\"_attachments\": { " > $TMP_FILE

addFile index.html "text/html" "$TMP_FILE"

#find assets -type f -name '*.html' -exec  bash -c 'addFile "$0" "text/html" "$TMP_FILE"' {} \;
find assets -type f -name '*.tmpl' -exec  bash -c 'addFile "$0" "text/html" "$TMP_FILE"' {} \;
find assets/img -type f -name '*.png' -exec  bash -c 'addFile "$0" "image/png" "$TMP_FILE"' {} \;

find dist -type f -name '*.js' -exec  bash -c 'addFile "$0" "application/javascript" "$TMP_FILE"' {} \;
find dist -type f -name '*.css' -exec  bash -c 'addFile "$0" "text/css" "$TMP_FILE"' {} \;

find dist -type f -name '*.woff' -exec  bash -c 'addFile "$0" "application/x-font-woff" "$TMP_FILE"' {} \;
find dist -type f -name '*.woff2' -exec  bash -c 'addFile "$0" "application/font-woff2" "$TMP_FILE"' {} \;

sed -i '$ s/.$//' $TMP_FILE
echo "  }
}" >> $TMP_FILE

curl -X PUT $HOST/$APP_DB/_design/sofia-app -H 'Content-Type: application/json' -d "@$TMP_FILE"

echo "Compacting database $APP_DB"
curl -X POST  -H 'Content-Type: application/json' $HOST/$APP_DB/_compact

echo "Admin app avalaible at : /$APP_DB/_design/sofia-app/index.html"

echo "Cleaning ..."
rm $TMP_FILE 
#cd ../../ && rm -Rf web-app/
cd ../ && rm -Rf web-app/
