/* global QRCode PouchDB */
var db = {};
function formatStats(stats){
	var ownerToShow = {
		"username" : {max:20},
		"echo1": {max:10},
		"golf": {max:5},
		"Team1": {max:2}
	}
	var html = '<div id="owners">'
	$.each(ownerToShow, function (id, params) {
		var  open = 0; //Set to zero by default
		if(typeof stats.owner[id] !== "undefined"){
			open = stats.owner[id].open; 
		}
    		html += '<div id="container-owner-'+id+'" style="width: 200px; height: 200px; float: left"></div>';
    		var specificOption = {
		        title: {
		            text: id
		        },
		        yAxis: {
		            min: 0,
			    max: params.max,
		            plotBands: [{
		                from: 0,
		                to: params.max*0.6,
		                color: '#55BF3B' // green
		            }, {
		                from: params.max*0.6,
		                to: params.max*0.8,
		                color: '#DDDF0D' // yellow
		            }, {
		                from: params.max*0.80,
		                to: params.max,
		                color: '#DF5353' // red
		            }]
			},
		        series: [{
		            data: [open]
		        }]	
    		}
    		window.setTimeout("Highcharts.chart('container-owner-"+id+"',"+JSON.stringify(Highcharts.merge(gaugeOptions,specificOption))+",function callback() {});",150)
	});
	html += '</div>'
	html += '<div id="affections">'
	$.each(ownerToShow, function (id, params) {
  		//stats.owner[d.owner_id].affection[d.primaryAffection].total++;
		var  affections = {}; //Set to empty by default
		if(typeof stats.owner[id] !== "undefined"){
			affections = stats.owner[id].affection; 
		}
    		html += '<div id="container-affections-owner-'+id+'" style="width: 200px; height: 200px; float: left">';
    		var specificOption = {
    		        yAxis: {
            			min: 0,
            			max: stats.fiche.total - stats.fiche.deleted
    		        },series: []
    		}
		$.each(affections, function (name, obj) {
			if(name.trim() === "" || name === null){ //empty name
				name = "undefined";
			}
			//html += '<p>'+name+' : '+JSON.stringify(obj)+'</p>';
			//html += '<p>'+name+' : '+obj.total+'</p>';
			var size = "100%"
			if(affections.length>1){
				size = (100-specificOption.series.length*(50/(affections.length-1)))+"%"
			}
			specificOption.series.push({
				name: name,
			        borderColor: Highcharts.getOptions().colors[specificOption.series.length],
			        data: [{
			                color: Highcharts.getOptions().colors[specificOption.series.length],
			                radius:size,
			                innerRadius: size,
			                y: obj.total  - obj.deleted
			        }]
			})
		})
		html += '</div>'
    		window.setTimeout("Highcharts.chart('container-affections-owner-"+id+"',"+JSON.stringify(Highcharts.merge(gaugeAffectionOptions,specificOption))+",function callback() {});",150)
	});
	html += '</div>'
	//html += JSON.stringify(stats)
	return html;
	//return JSON.stringify(stats);
}
function getStats(){
	db.fiches.allDocs({include_docs: true}).then(function(result){
		console.log(result);
		var stats = {
			fiche : {
				total:0,
				open:0,
				close:0,
				deleted:0,
				affection : {
					
				}
			},
			owner : {
				
			}
		};
		$.each(result.rows, function (index, obj) {
  			//console.log(obj.doc)
  			var d = obj.doc;
			if (d._id[0] === '_') //Maybe a _design doc
				return;
  			//if(typeof obj.doc["_conflicts"] !== "undefined" && obj.doc["_conflicts"].length > 0 ){
  			if(typeof stats.owner[d.owner_id] === "undefined" ){
	  			stats.owner[d.owner_id] = {
					total:0,
					open:0,
					close:0,
					deleted:0,
					affection : {}
				}
  			}
  			if(typeof stats.owner[d.owner_id].affection[d.primaryAffection] === "undefined" ){
	  			stats.owner[d.owner_id].affection[d.primaryAffection] = {
					total:0,
					open:0,
					close:0,
					deleted:0
				}
  			}
  			if(typeof stats.fiche.affection[d.primaryAffection] === "undefined" ){
	  			stats.fiche.affection[d.primaryAffection] = {
					total:0,
					open:0,
					close:0,
					deleted:0
				}
  			}
  			stats.fiche.total++;
  			stats.owner[d.owner_id].total++;
  			stats.fiche.affection[d.primaryAffection].total++;
  			stats.owner[d.owner_id].affection[d.primaryAffection].total++;
  			if (d.deleted){
  				stats.fiche.deleted++;
  				stats.owner[d.owner_id].deleted++;
  				stats.fiche.affection[d.primaryAffection].deleted++;
  			        stats.owner[d.owner_id].affection[d.primaryAffection].deleted++;
  			}else if (d.closed){
  				stats.fiche.close++;
  				stats.owner[d.owner_id].close++;
  				stats.fiche.affection[d.primaryAffection].close++;
  			        stats.owner[d.owner_id].affection[d.primaryAffection].close++;
  			}else{
  				stats.fiche.open++;
  				stats.owner[d.owner_id].open++;
  				stats.fiche.affection[d.primaryAffection].open++;
  			        stats.owner[d.owner_id].affection[d.primaryAffection].open++;
  			}
		});
		console.log(stats);
		$("#stat_vue").html(formatStats(stats));
	});
}
function getRandomPass(){
  return Math.random().toString(36).substr(2, 5)
}
function validateMerge() {
  $('#conflict>button').attr('disabled', 'disabled').text('Sending ...').blur();
  var obj = JSON.parse($(".page#conflict>#editor>#result>.raw").html()); //TODO check obj ?
  obj.events.push({
            type : "action",
            action : "AdminMergeConflict",
            message : "Conflict detected and merged by admin!",
            /* This take to much space
            diff : objectDiff.diff(JSON.parse($(".page#conflict>#editor>#src").html()),obj),
            conflict : JSON.parse($(".page#conflict>#editor>#conflict").html()),
            */
            timestamp : Date.now(),
            user :  "admin" //TODO
  });
  db.fiches.put(obj).then(function () {
    $(".page#conflict>#editor>#src").html("");
    $(".page#conflict>#editor>#conflict").html("");
    $(".page#conflict>#editor>#result>.raw").html("");
    showRaw();
    $('#conflict>button').text('Removing conflict ...').blur();
    db.fiches.remove($('#conflict>button').attr("data-id"), $('#conflict>button').attr("data-rev")).then(function () {
      $('#conflict>button').removeAttr('data-id').removeAttr('data-rev');
      $('#conflict>button').text('Finish !').css('background-color', 'green');
      getConflicts(); //update conflict list
      window.setTimeout('$("#conflict>button").text("Validate Merge").css("background-color", "#9b4dca")', 3000);
      // yay, we're done
    }).catch(function (err) {
        // handle any errors
        console.log(err);
        alert(err.message);
    });
  }).catch(function (err) {
    console.log(err);
    alert(err.message);
  });
}
function mergeConflict(o,n,rev) { // o : obj in db, n: obj to commit
   /* This will merge and keep a maximum of information (things deleted previously could be added) */
   var ret = $.extend({},o,{
     close_context : n.close_context,
     deleted : n.deleted,
     closed : n.closed,
     patient : n.patient,
     origin : n.origin,
     owner_id : n.owner_id,
     primaryAffection : n.primaryAffection,
     uid : n.uid
   }); //Close and overwrite some parts that can be directly
   $.each(n.pathologys, function(id,val){
     if ($.inArray(val,ret.pathologys) === -1) { //Not found
       ret.pathologys.push(val);
     }
   });
   $.each(n.events, function(id,val){
     /*
     if ($.inArray(val,ret.events) === -1) { //Not found
       ret.events.push(val);
     }
     */
       var found = false;
       var searching = JSON.stringify(val);
       $.each(ret.events, function(i,v){
         if(!found && JSON.stringify(v) === searching ){
           found = true;
         }
       });
       if(!found){
         ret.events.push(val);
       }
   });
   ret.events.sort(function(x, y){ //Order
     return x.timestamp - y.timestamp;
   });
   /* */
   ret._rev=rev;
   return ret;
   console.log(ret);
}
function showRaw(){
  console.log("Showing raw")
  $("button[onclick='showRaw()']").attr('disabled', 'disabled');
  $("button[onclick='showDiff()']").removeAttr('disabled');
  $(".page#conflict>#editor>#result>.diffResult").hide()
  $(".page#conflict>#editor>#result>.raw").show()
}
function showDiff(){
  console.log("Showing diff")
  $("button[onclick='showRaw()']").removeAttr('disabled');
  $("button[onclick='showDiff()']").attr('disabled', 'disabled');
  $(".page#conflict>#editor>#result>.diffResult").show()
  $(".page#conflict>#editor>#result>.raw").hide()
  var src = JSON.parse($(".page#conflict>#editor>#src").html());
  var result = JSON.parse($(".page#conflict>#editor>#result>.raw").html());
  console.log(src,result);
  var diff = objectDiff.diff(src,result);
  console.log(diff);
  $(".page#conflict>#editor>#result>.diffResult").html(objectDiff.convertToXMLString(diff))
}
function resolveConflict(id,rev){
  console.log("conflict getting doc:",id,rev);
  db.fiches.get(id).then(function(doc) {
    db.fiches.get(id, {rev: rev}).then(function (conflict) {
      // do something with the doc
        console.log("conflict resolution:",doc,conflict);
        $(".page#conflict>#editor>#src").html(JSON.stringify(doc));
        $(".page#conflict>#editor>#conflict").html(JSON.stringify(conflict));
        if(doc.events[doc.events.length-1].timestamp>conflict.events[conflict.events.length-1].timestamp){
          $(".page#conflict>#editor>#result>.raw").html(JSON.stringify(mergeConflict(conflict,doc,doc._rev))); //The doc in DB is more recent that the conflict
        }else {
          $(".page#conflict>#editor>#result>.raw").html(JSON.stringify(mergeConflict(doc,conflict,doc._rev))); //The conflict in DB is more recent that the conflict
        }
        showRaw();
        $('#conflict>button').removeAttr('disabled').attr("data-id",id).attr("data-rev",rev)
    }).catch(function (err) {
      // handle any errors
      alert(err.message)
    });
  }).catch(function (err) {
    // handle any errors
    alert(err.message)
  });
}
function getConflicts(){
	db.fiches.allDocs({
			include_docs: true,
			conflicts: true,
  		attachments: true
		}).then(function(result){
			console.log(result);
      var html='<div class="row">';
	    $.each(result.rows, function (index, obj) {
  			//console.log(obj.doc)
  			if(typeof obj.doc["_conflicts"] !== "undefined" && obj.doc["_conflicts"].length > 0 ){
  				//We got conflict
  	      console.log("Conflict !" , obj.doc);
          if(index>0 && index%3 === 0){
            html+='</div><div class="row">';
          }
          var conflicts = ""
    	    $.each(obj.doc._conflicts, function (i, conflict) {
            conflicts += "<a class='button button-small' onclick='resolveConflict(\""+obj.doc._id+"\",\""+conflict+"\")' href='#'>"+conflict+"</a>";
          });
  				html+='<div class="column">'+obj.doc._id+'<p>'+conflicts+'</p>'+'</div>';
  			}
		  });
      html+='</div>'
      $(".page#conflict>#conflicts").html(html);
		}).catch(function (err) {
  			console.log(err);
		});
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
function init(){
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
}

var gaugeAffectionOptions= {
	chart: {
            type: 'solidgauge',
            marginTop: 50
        },
        title: {
            text: 'Affections',
            style: {
                fontSize: '24px'
            }
        },
        credits: {
            enabled: false
        },
        tooltip: {
            borderWidth: 0,
            backgroundColor: 'none',
            shadow: false,
            style: {
                fontSize: '16px'
            },
            pointFormat: '{series.name}<br><span style="font-size:2em; color: {point.color}; font-weight: bold">{point.y}%</span>',
            positioner: function (labelWidth, labelHeight) {
                return {
                    x: 200 - labelWidth / 2,
                    y: 180
                };
            }
        },
        pane: {
            startAngle: 0,
            endAngle: 360,
            background: [{ // Track for Move
                outerRadius: '112%',
                innerRadius: '88%',
                backgroundColor: Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0.3).get(),
                borderWidth: 0
            }, { // Track for Exercise
                outerRadius: '87%',
                innerRadius: '63%',
                backgroundColor: Highcharts.Color(Highcharts.getOptions().colors[1]).setOpacity(0.3).get(),
                borderWidth: 0
            }, { // Track for Stand
                outerRadius: '62%',
                innerRadius: '38%',
                backgroundColor: Highcharts.Color(Highcharts.getOptions().colors[2]).setOpacity(0.3).get(),
                borderWidth: 0
            }]
        },
        yAxis: {
            min: 0,
            max: 100,
            lineWidth: 0,
            tickPositions: []
        },
        plotOptions: {
            solidgauge: {
                borderWidth: '34px',
                dataLabels: {
                    enabled: false
                },
                linecap: 'round',
                stickyTracking: false
            }
        },
};
var gaugeOptions= {

        chart: {
            type: 'gauge',
            plotBackgroundColor: null,
            plotBackgroundImage: null,
            plotBorderWidth: 0,
            plotShadow: false
        },

        title: {
            text: 'Team'
        },
        credits: {
            enabled: false
        },
        pane: {
            startAngle: -150,
            endAngle: 150,
            background: [{
                backgroundColor: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                    stops: [
                        [0, '#FFF'],
                        [1, '#333']
                    ]
                },
                borderWidth: 0,
                outerRadius: '109%'
            }, {
                backgroundColor: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                    stops: [
                        [0, '#333'],
                        [1, '#FFF']
                    ]
                },
                borderWidth: 1,
                outerRadius: '107%'
            }, {
                // default background
            }, {
                backgroundColor: '#DDD',
                borderWidth: 0,
                outerRadius: '105%',
                innerRadius: '103%'
            }]
        },
        yAxis: {
            min: 0,
            max: 200,
            minorTickInterval: 'auto',
            minorTickWidth: 1,
            minorTickLength: 10,
            minorTickPosition: 'inside',
            minorTickColor: '#666',

            tickPixelInterval: 30,
            tickWidth: 2,
            tickPosition: 'inside',
            tickLength: 10,
            tickColor: '#666',
            labels: {
                step: 2,
                rotation: 'auto'
            },
            title: {
                text: 'open'
            },
            plotBands: [{
                from: 0,
                to: 120,
                color: '#55BF3B' // green
             }, {
                from: 120,
                to: 160,
                color: '#DDDF0D' // yellow
            }, {
                from: 160,
                to: 200,
                color: '#DF5353' // red
            }]
	},
        series: [{
            name: 'Open',
            data: [0],
            tooltip: {
                valueSuffix: ' fiche(s)'
            }
        }]
};

$(function () {
	init(); //TODO direcly set init inplace of anonymous func
});
