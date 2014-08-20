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

function convertJsonResponseToNodes(projectName, json){
	console.log("Converting Json Response to Node list");
	var nodes = {};
	nodes.name = projectName;
	nodes.children=[];
	for(var i = 0; i < json.data.length; i++){
		nodes.children[i] = {name: json.data[i][0], group: json.data[i][1], version: json.data[i][2], relationtype:json.data[i][3]};
	}
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