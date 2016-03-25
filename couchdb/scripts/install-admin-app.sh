#!/bin/bash
#Install sofia admin couchapp

HOST=$1
ADMIN_DB=$2
#ID=$(curl -X GET $HOST/$ADMIN_DB/_design/sofia-admin | cut -d"\"" -f8)

function encodeFile() {
    #echo $1
    openssl base64 < "admin-app/$1" | tr '\n' ' ';
}
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
echo "{\"_attachments\": { " > /tmp/upload-data
#$(openssl base64 < "admin-app/$file" | tr '\n' ' ')


fileList="index.html";
for file in $fileList
do
    echo "   \"$file\": {
       \"content_type\": \"text/html\",
       \"data\": \"$(encodeFile $file)\"
    }," >> /tmp/upload-data
done

fileList="lib/milligram.min.css lib/trumbowyg/ui/trumbowyg.min.css";
for file in $fileList
do
    echo "   \"$file\": {
       \"content_type\": \"text/css\",
       \"data\": \"$(encodeFile $file)\"
    }," >> /tmp/upload-data
done

fileList="lib/trumbowyg/ui/images/icons-black-2x.png lib/trumbowyg/ui/images/icons-black.png";
for file in $fileList
do
    echo "   \"$file\": {
       \"content_type\": \"image/png\",
       \"data\": \"$(encodeFile $file)\"
    }," >> /tmp/upload-data
done

fileList="script.js lib/jquery-2.2.0.min.js lib/pouchdb-5.2.1.min.js lib/qrcode.min.js lib/trumbowyg/trumbowyg.min.js";
for file in $fileList
do
    echo "   \"$file\": {
       \"content_type\": \"application/javascript\",
       \"data\": \"$(encodeFile $file)\"
    }," >> /tmp/upload-data
done

sed -i '$ s/.$//' /tmp/upload-data
echo "  }
}" >> /tmp/upload-data

#cat /tmp/upload-data

curl -X PUT $HOST/$ADMIN_DB/_design/sofia-admin -H 'Content-Type: application/json' -d @/tmp/upload-data

rm /tmp/upload-data

echo "Compacting database $ADMIN_DB"
curl -X POST  -H 'Content-Type: application/json' $HOST/$ADMIN_DB/_compact

echo "Admin app avalaible at : /$ADMIN_DB/_design/sofia-admin/index.html"
