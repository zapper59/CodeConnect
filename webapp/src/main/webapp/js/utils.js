"use strict";
function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(rgb) {
	return "#" + componentToHex(rgb.r) + componentToHex(rgb.g) + componentToHex(rgb.b);
}

function convertJsonResponseToNodes(projectName, projectVersion, json){
	console.log("Converting Json Response to Node list:");
	console.log(json);
	var nodes = {};
	nodes.name = projectName;
	nodes.children=[];
	nodes.versions=[];
	nodes.versions.push(projectVersion);
	for(var i = 0; i < json.data.length; i++){
		nodes.children[i] = {name: json.data[i][0], group: json.data[i][1], version: json.data[i][2], relationtype:json.data[i][3]};
	}
	console.log(nodes.versions);
	return nodes;
}

function generateRandomColor() {
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';
	for (var i=0; i<6; i++ ) {
		color += letters[Math.floor(Math.random() * letters.length)];
	}
	return color;
}

function compareVersionStrings(one, two) {
	if($.type(one) !== "string") {
		throw new Error("IllegalArgument one: " + one);
	}
	if($.type(two) !== "string") {
		throw new Error("IllegalArgument two: " + two);
	}

	if (one === two)
		return 0;

	var onearr = one.replace(/[^.\-0-9]/g,"").split(/[-.]/);
	var twoarr = two.replace(/[^.\-0-9]/g,"").split(/[-.]/);

	if (onearr.length == 0)
		return -1;
	if (twoarr.length == 0)
		return 1;

	var ans = 0;
	for(var i=0; i<onearr.length && i<twoarr.length; i++) {
		if(Number(onearr[i]) < Number(twoarr[i]))
			return ans = -1;
		if(Number(onearr[i]) > Number(twoarr[i]))
			return ans = 1;
	};
	if(ans == 0) {
		if(onearr.length > twoarr.length)
			return 1;
		if(onearr.length < twoarr.length)
			return -1;
	}

	return ans;
};