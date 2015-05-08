"use strict";
//TODO refactor this file
var NEO4J_SERVER_URL = "http://rcdn6-vm97-107:7474/db/data/cypher/";
var getProjectNames = function(callback){
	var data = {
			"query":"MATCH (up:Project) RETURN DISTINCT up.name ORDER BY up.name",
			"params" : {
				}
			};
		$.ajax({
			type: "POST",
			url: NEO4J_SERVER_URL,
			headers: {"Accept": "application/json",
					 "Content-Type":"application/json"},
			data: JSON.stringify(data),
			cache: false,
			dataType:"json",
			success: function(data){
				callback(data);
			},
			error:function(xhr,err,msg){
				console.log("Failed POST Query");
				console.log(xhr);
				console.log(err);
				console.log(msg);
			}
		});
}

var getProjectGroups = function(projectName, callback){
	var data = {
			"query":"MATCH (up:Project {name:{projectName}}) RETURN up.group",
			"params" : {
				"projectName":projectName
				}
			};
		$.ajax({
			type: "POST",
			url: NEO4J_SERVER_URL,
			headers: {"Accept": "application/json",
					 "Content-Type":"application/json"},
			data: JSON.stringify(data),
			cache: false,
			dataType:"json",
			success: function(data){
				var unique = {"data":[]};
				$.each(data.data, function(i, el){
					if($.inArray(el[0], unique.data) === -1) unique.data.push(el[0]);
				});
				callback(unique, projectName);
			},
			error:function(xhr,err,msg){
				console.log("Failed POST Query");
				console.log(xhr);
				console.log(err);
				console.log(msg);
			}
		});
}

var getProjectVersions = function( projectName, projectGroup, callback ){
	var data = {
		"query":"MATCH (up:Project {name:{projectName}, group:{projectGroup}}) RETURN up.version",
		"params" : {
				"projectName" : projectName,
				"projectGroup" : projectGroup
			}
		};
	$.ajax({
		type: "POST",
		url: NEO4J_SERVER_URL,
		headers: {"Accept": "application/json",
				 "Content-Type":"application/json"},
		data: JSON.stringify(data),
		cache: false,
		dataType:"json",
		success: function(data){
			callback(data, projectName, projectGroup);
		},
		error:function(xhr,err,msg){
			console.log("Failed POST Query");
			console.log(xhr);
			console.log(err);
			console.log(msg);
		}
	});
}

var isProjectOutdated = function( projectName, projectGroup, projectVersion, callback ){
	var data = {
		"query":"MATCH (up:Project {name:{projectName}, group:{projectGroup}}) RETURN up.version",
		"params" : {
				"projectName" : projectName,
				"projectGroup" : projectGroup
			}
		};
	$.ajax({
		type: "POST",
		url: NEO4J_SERVER_URL,
		headers: {"Accept": "application/json",
				 "Content-Type":"application/json"},
		data: JSON.stringify(data),
		cache: false,
		dataType:"json",
		success: function(data){
			var outdated = false;
			var newest = projectVersion;
			$.each(data.data, function(i, val){
				if(compareVersionStrings(projectVersion, val[0]) < 0){
					outdated = true;
				}
				if(compareVersionStrings(newest, val[0]) < 0){
					newest = val[0];
				}
			})
			callback(outdated, projectName, projectGroup, projectVersion, newest);
		},
		error:function(xhr,err,msg){
			console.log("Failed POST Query");
			console.log(xhr);
			console.log(err);
			console.log(msg);
		}
	});
}

var getProjectData = function( projectName, projectGroup, projectVersion, callback, inbound){
	var data = {}
	data = {
		"query":"MATCH (up:Project {name:{projectName}, group:{projectGroup}"
			+ ((projectVersion) ? ", version:{projectVersion}" : "")
			+ "})" + (inbound ? "<-[rel]-" : "-[rel]->")
			+ "(down) RETURN down.name, down.group, down.version, type(rel)",
		"params" : {
			"projectName" : projectName,
			"projectGroup" : projectGroup,
			"projectVersion" : projectVersion
		}
	};
	$.ajax({
		type: "POST",
		url: NEO4J_SERVER_URL,
		headers: {"Accept": "application/json",
				 "Content-Type":"application/json"},
		data: JSON.stringify(data),
		cache: false,
		dataType:"json",
		success: function(json) {
			callback(json, projectName, projectGroup, projectVersion);
		},
		error:function(xhr,err,msg){
			console.log("Failed POST Query");
			console.log(xhr);
			console.log(err);
			console.log(msg);
		}
	});
}