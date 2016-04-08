/* global QRCode PouchDB */
var db = {};
function getRandomPass(){
  return Math.random().toString(36).substr(2, 5)
}
function updtUsersList(){
        console.log('Updating users list ...');
        $('#teams>button').attr('disabled', 'disabled').text('Sending ...').blur();

        var list = []
        $("#teams>table>tbody>tr[data-name]").each(function(){list.push($(this).attr("data-name"))});
        console.log(list);
        db.fiches.get('_design/sofia-config').then(function(doc) {
          doc.users = list;
          return db.fiches.put(doc);
        }).then(function(result) {
          // handle response
          console.log(result);
          $('#memo textarea').attr('data-rev', result.rev);
          $('#teams>button').removeAttr('disabled').text('Sauvegardé !').css('background-color', 'green');
          window.setTimeout('$("#teams>button").text("Update team list in App").css("background-color", "#9b4dca")', 3000);
        }).catch(function (err) {
          console.log(err);
        });
}
function resetAllUsersPassword(){
        if (!confirm("This will reset ALL users password ! Are you sure ?")){
          return;
        }
        $("#export>#table>.row>.column").each(function (index) {
          var el=$(this);
          var id = el.attr('data-uID');
          var rev = el.attr('data-uRev');
          var name = el.attr('data-uName');
          var pass = getRandomPass();
          //console.log(id,rev,name,pass);
          el.find("canvas").remove();
          el.find("img").remove();
          db.users.put({
            _id: id,
            _rev: rev,
            type: 'user',
            name: name,
            password: pass,
            roles: [
               'equipier',
            ],
          }).then(function (response) {
            //console.log(response);
            el.attr('data-uRev', response.rev);
            el.find(".column:first p:last").show().find("span").text(pass);
            generateUsersQRCode(el);
          }).catch(function (err) {
            console.log(err);
            alert(err.message);
          });
          //*/
        });
}
function generateUsersQRCode(el){
        if(typeof el === "undefined"){ //Nothing no el is provided we generate for all
          $("#export>#table>.row>.column").each(function (index) {
            generateUsersQRCode($(this));
          });
        }else{ //If we have a el we generate only for it
          var w=el.find(".column:last").width()-(el.is(".column-50")?10:6);
          var u = el.attr("data-fullURL");
          if(el.find(".column:first p:last").is(":visible")){
            //console.log("We have a password : " +  el.find(".column:first p:last span").text())
            u = u.replace("@", ":"+el.find(".column:first p:last span").text()+"@")
          }
          //.find("span").text(getRandomPass()))
          let divID = 'qrcode-user-'+el.attr("data-uID")
          console.log(u,divID,"#"+divID.replace( /(:|\.|\[|\]|,)/g, "\\$1" ));
          $("#"+divID.replace( /(:|\.|\[|\]|,)/g, "\\$1" )).html(""); //Remove old QRCode
          new QRCode(divID, {
            text : u,
            width: w,
            height: w
          });
        }
}
function generateUsersData(){
  var table = $('#export>#table');
  var tmp = db.fiches._db_name.split('/');
  var dbName = tmp.pop();
  var url =  tmp.join('/');
  var count=0;
  table.html('');
  var style = {
      row_count : 2,
      column : 60
  }
  /*
  if($(document).width()>920){
     style = {
      row_count : 3,
      column : 75
    }
  }
  */
  db.users.allDocs({ include_docs: true }).then(function (result) {
              console.log(result);
              var len = result.rows.length;
              $.each(result.rows, function (index, value) {
                var user = value.doc;
                if (user.type != 'user')
                  return; //Ex _design doc
                console.log(user);


                if(count%style.row_count==0){
                  table.append('<div class="row"></div>');
                }
                var urlFull = db.fiches._db_name.split("/");
                console.log(urlFull);
                urlFull[2]=user.name+"@"+urlFull[2];
                console.log(urlFull);
                urlFull=urlFull.join("/");
                console.log(urlFull);
                table.find(">.row:last").append(
                  '<div class="column column-'+Math.floor(100/style.row_count)+'" data-uName="'+user.name+'" data-uRev="'+user._rev+'" data-uID="'+user._id+'" data-fullURL="'+urlFull+'"><div class="row">'+
                    '<div class="column column-'+style.column+'">'+
                      '<p>URL: <span>'+url+'</span></p>'+
                      '<p>Database Name: <span>'+dbName+'</span></p>'+
                      '<p>Pseudo: <span>'+user.name+'</span></p>'+
                      '<p style="display:none">Password: <span>TODO</span></p>'+
                    '</div>'+
                    '<div class="column column-'+(100-style.column)+'"><div id="qrcode-user-'+user._id+'"></div></div>'+
                  '</div></div>');
                count++;

              });
            }).catch(function (err) {
              // handle err
              console.log(err);
  });
}
function addUserToTable(user) {
        $('#teams>table>tbody').append('<tr data-name=\'' + user.name + '\' data-id=\'' + user._id + '\' data-rev=\'' + user._rev + '\'><td>' + user.name + '</td><td><button class=\'button button-outline\' onclick=\'resetPass(this)\' >Reset</button></td><td>' + JSON.stringify(user.roles) + '</td><td><button class=\'button button-outline\' onclick=\'delUser(this)\' >Delete</button></td></tr>');
      }

function showConfiguration() {
        $('#configuration #url').val(db.fiches._db_name);
        new QRCode(document.getElementById('qrcode'), db.fiches._db_name);
      }

function resetPass(el) {
        console.log('Reseting user pass ...', el);
        var tr = $(el).parent().parent();
        var id = tr.attr('data-id');
        var rev = tr.attr('data-rev');
        var name = tr.attr('data-name');
        db.users.put({
          _id: id,
          _rev: rev,
          type: 'user',
          name: name,
          password: prompt('Choose a password :', getRandomPass()),
          roles: [
             'equipier',
          ],
        }).then(function (response) {
          tr.attr('data-rev', response.rev);
          console.log(response);
        }).catch(function (err) {
          console.log(err);
          alert(err.message);
        });;

        //TODO check password before sending
      }

function delUser(el) {
        console.log('Deleting user ...', el);
        var tr = $(el).parent().parent();
        var id = tr.attr('data-id');
        var rev = tr.attr('data-rev');
        var name = tr.attr('data-name');
        console.log(tr, id, rev, name);
        if (confirm('Etes vous sur de supprimer : ' + name + ' ?')) {
          db.users.remove(id, rev).then(function (response) {
            tr.remove();
            updtUsersList();
          }).catch(function (err) {
            console.log(err);
            alert(err.message);
          });
        }
      }

function addUser() {
        console.log('Adding user ...');
        $('#add-user button').attr('disabled', 'disabled').text('Sending ...').blur();
        $('#add-user input').attr('disabled', 'disabled');
        var user = {
          _id: 'org.couchdb.user:' + $('#add-user input#name').val(),
          type: 'user',
          name: $('#add-user input#name').val(),
          password: $('#add-user input#password').val(),
          roles: [
             'equipier',
          ],
        };

        db.users.put(user).then(function (response) {
          // handle response
          console.log(response);

          //TODO add line
          //TODO reset input
          //window.location.reload();
          $('#add-user input').val('').removeAttr('disabled');
          $('#add-user button').removeAttr('disabled').text('Sauvegardé !').css('background-color', 'green');
          window.setTimeout('$("#add-user button").text("Valider").css("background-color", "#9b4dca")', 1000);
          user._rev = response.rev;
          addUserToTable(user);
          updtUsersList();
        }).catch(function (err) {
          console.log(err);
          alert(err.message);
        });

      }

function updateMemo() {
        var textarea = $('#memo textarea');
        var attachment = new Blob([textarea.val()], { type: 'text/html' });
        $('#memo>button').attr('disabled', 'disabled').text('Sending ...').blur();
        console.log('Updating memo ...', attachment, textarea.attr('data-rev'));
        //*
        db.fiches.get('_design/sofia-config').then(function(doc) {
          return db.fiches.putAttachment('_design/sofia-config', 'memo.html',  doc._rev, attachment, 'text/html');
        }).then(function (result) {
          // handle result
          console.log(result);
          textarea.attr('data-rev', result.rev);
          $('#memo>button').removeAttr('disabled').text('Sauvegardé !').css('background-color', 'green');
          window.setTimeout('$("#memo>button").text("Valider").css("background-color", "#9b4dca")', 3000);
        }).catch(function (err) {
          console.log(err);
          alert(err.message);
        });

        //*/
      }

function testAccess(db, success, fail) {
  db.info().then(function (info) {
    console.log(info);

    //we are logged in
    success();
  }).catch(function (error) {
            console.log('Error detected', error);
            fail(error, db, success, fail);
          });
}

function askCredential() {
  var creds = (localStorage.SofiaCreds && localStorage.SofiaCreds != 'undefined') ? JSON.parse(localStorage.SofiaCreds) : { username: 'couchdb', password: '' };
  return {
    username: prompt('Admin username :', creds.username),
    password: prompt('Admin password :', creds.password),
  };
}

$(function () {
  console.log('Ready!');
  $("#menu>a").on("click",function(){
    $("#menu>a").addClass("button-outline");
    $(this).removeClass("button-outline");
    $(".page").hide();
    $(".page#"+$(this).attr("id")).show();
  })
  db.users = new PouchDB(window.location.protocol + '//' + window.location.host + '/_users', {
    auth: askCredential(), // try without because we are maybe auth by the futon */
  });

  testAccess(db.users, function () {
            //We are in user db
            console.log(db);

            //Backup
            localStorage.SofiaCreds = JSON.stringify(db.users.__opts.auth);

            //Filling user table
            db.users.allDocs({ include_docs: true }).then(function (result) {
              console.log(result);
              $.each(result.rows, function (index, value) {
                var user = value.doc;
                if (user.type != 'user')
                  return; //Ex _design doc
                console.log(user);
                addUserToTable(user);
              });
            }).catch(function (err) {
              // handle err
              console.log(err);
            });

            //Setting options
            var opts = db.users.__opts;
            opts.skip_setup = true;

            //db.fiches = new PouchDB(db.users._db_name.slice(0, -6) + prompt('Database name : ', localStorage.SofiaDB || window.location.pathname.split('/')[1]), opts);
            db.fiches = new PouchDB(db.users._db_name.slice(0, -6) + prompt('Database name : ', localStorage.SofiaDB || "sofia-fiches"), opts);
            db.fiches.host = db.users._db_name.slice(0, -6);
            testAccess(db.fiches, function () {
              //User and sofia DB ready to be used
              localStorage.SofiaDB = db.fiches._db_name.split('/').pop();

              //Filling memo part
              //db.fiches.getAttachment('_design/sofia-config', 'memo.html')
              db.fiches.get('_design/sofia-config', { attachments: true, binary: true }).then(function (doc) {
                // handle result
                console.log("Get memo",doc)
                $('#memo textarea').attr('data-rev', doc._rev);
                var reader = new FileReader();
                reader.onload = function (event) {
                  $('#memo textarea').val(reader.result);
                  $('#memo textarea').trumbowyg();
                  showConfiguration();
                  $("#menu>a#configuration").click();
                };

                reader.readAsText(doc._attachments['memo.html'].data);
              }).catch(function (err) {
                console.log(err);
              });

            }, function (error, db, success, fail) {

              alert(error.message);
              console.log(error, db);
              if (error.status == 404) {
                db = new PouchDB(db.host + prompt('Database name : ', localStorage.SofiaDB), db.__opts);
                testAccess(db, success, fail);
              }
            });
          }, function (error, db, success, fail) {

            console.log(error);
            alert(error.message);
            if (error.status == 401) {
              db = new PouchDB('http://carapuce.sapk.fr:5984/_users', {
                  auth: askCredential(),
                });
              testAccess(db, success, fail);
            }
          });

});
