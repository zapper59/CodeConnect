var CodeConnect = function(selector, w, h) {
	this.w = w;
	this.h = h;
	this.mLinkNum = {};
	this.current = {
		dependency : undefined,
		downstream : undefined
	};
	d3.select(selector).selectAll("svg").remove();

	this.svg = d3.select(selector).append("svg:svg").attr('width', w).attr(
			'height', h);

	this.svg.append("svg:rect").attr('width', w).attr('height', h);

	this.force = d3.layout.force().on("tick", this.tick.bind(this))
	// TODO make these functions vary on something
	.charge(function(d) {
		return -4000;
	}).linkDistance(function(d) {
		return 260;
	}).size([ w, h ]);
};

CodeConnect.prototype.updateSize = function(w, h) {
	this.w = w;
	this.h = h;
	this.svg.attr('width', w).attr('height', h);
	$("body").attr('width', w).attr('height', h);
	this.svg.select("rect").attr('width', w).attr('height', h);
	this.force.size([ w, h ]);
	this.force.start();
	// TODO: Re-center web
};
CodeConnect.prototype.update = function(json, projectName) {
	if (json) {
		this.json = json;
		this.metadata = this.flattenAndGatherMeta(this.json);
	}
	if (projectName) {
		this.projectName = projectName;
	}

	this.json.fixed = true;
	this.json.x = this.w / 2;
	this.json.y = this.h / 2;

	var nodes = this.metadata.reducedNodes;
	var links = this.metadata.links;
	this.setLinkIndexAndNum(links);
	var total = nodes.length || 1;

	this.svg.selectAll("g").remove();

	// Restart the force layout
	this.force.nodes(nodes).links(links).gravity(
			Math.atan(total / 100) / Math.PI * 0.3).start();

	if (this.path)
		this.path.remove();

	this.path = this.svg.append("svg:g").selectAll("path").data(
			this.force.links()).enter().append("svg:path")
			.attr("class", "link").attr(
					"id",
					function(d) {
						return d.target.name + "-" + d.target.group + "-"
								+ d.target.version + "-" + d.relationtype
					}).attr("style", function(d) {
				return "stroke:" + d.linkcolor;
			});

	if (this.circle)
		this.circle.remove();

	this.circle = this.svg.append("svg:g").selectAll("circle").data(
			this.force.nodes()).enter().append("svg:circle").attr("r",
			function(d) {
				return d.children ? 20 : 10;
			}).attr("style", function(d) {
		return "fill:" + d.downstreamcolor;
	}).attr("id", function(d) {
		return d.name + "-" + d.group + "-" + d.version + "-NODE"
	}).on("click", this.click.bind(this)).on("mouseover",
			this.mouseover.bind(this)).on("mouseout", this.mouseout.bind(this))
			.call(this.force.drag);

	this.nodetext = this.svg.append("svg:g").selectAll("g").data(
			this.force.nodes()).enter().append("svg:g");

	this.curvepathtext = this.svg.append("svg:g").selectAll("g").data(
			this.force.links()).enter().append("text").attr('text-anchor',
			'middle').append("textPath").attr(
			"xlink:href",
			function(d) {
				return "#" + d.target.name + "-" + d.target.group + "-"
						+ d.target.version + "-" + d.relationtype;
			}).classed("radial-text-path", true).style("font-size",
			18 + 'px')
			// TODO calculate this
	.attr("startOffset", function(d) {
		return "30%";
	}).text(function(d) {
		return d.relationtype;
	});

	if ($("#downstream-label").is(':checked')) {
		this.curvepathtext.style('display', null);
	} else {
		this.curvepathtext.style('display', "none");
	}

	this.nodetext.append("svg:text").attr("x", 12).attr("y", ".31em").attr(
			"class", "shadow").text(function(d) {
		return (d.version) ? d.name + "--[" + d.version + "]" : d.name;
	});

	this.nodetext.append("svg:text").attr("x", 12).attr("y", ".31em").attr(
			"class", "light").text(function(d) {
		return (d.version) ? d.name + "--[" + d.version + "]" : d.name;
	});

	this.nodetext.append("svg:text").attr("x", 12).attr("y", ".31em").text(
			function(d) {
				return d.name;
			});

	if ($("#dependency-label").is(':checked')) {
		this.nodetext.style('display', null);
	} else {
		this.nodetext.style('display', "none");
	}

	this.populateLegend();

	return this;
};

CodeConnect.prototype.tick = function() {
	var h = this.h;
	var w = this.w;

	this.nodetext.attr("transform", function(d) {
		return "translate(" + d.x + "," + d.y + ")";
	});

	this.circle.attr(
			"style",
			function(d) {
				if (d.x < 5)
					d.x = 5;
				if (d.x > w - 5)
					d.x = w - 5;
				if (d.y < 5)
					d.y = 5;
				if (d.y > h - 5)
					d.y = h - 5;
				return this.shouldDownstreamShowSelected(d) ? "fill:"
						+ d.downstreamcolor : "fill: silver";
			}.bind(this)).attr("transform", function(d) {
		return "translate(" + d.x + "," + d.y + ")";
	});

	if(this.metadata){
		for(var project in this.metadata.outdatedprojects){
			var element = d3.select("#display").select("circle[id='"+this.metadata.outdatedprojects[project]+"']");
			if(element){
				element.style("fill","Red");
			}
		}
	}

	this.path
			.attr(
					"style",
					function(d) {
						if(! $("#separate-downstream-lines").is(":checked")){
							return "stroke: SlateGray";
						}
						return this.shouldLinkShowSelected(d) ? "stroke:" + d.linkcolor : "stroke: silver";
					}.bind(this))
			.attr(
					"d",
					function(d) {
						var dx = d.target.x - d.source.x, dy = d.target.y
								- d.source.y, dr = Math.sqrt(dx * dx + dy * dy);
						// get the total link numbers between source and target
						// node
						var lTotalLinkNum = this.mLinkNum[d.target.name + "-"
								+ d.target.group + "-" + d.target.version];
						var curve = "";
						if(! $("#separate-downstream-lines").is(":checked")){
							curve = "M" + d.source.x + "," + d.source.y + " L" + d.target.x + "," + d.target.y;
						} else if (lTotalLinkNum % 2 == 1
								&& lTotalLinkNum == d.linkindex){
							curve = "M" + d.source.x + "," + d.source.y + " L"
									+ d.target.x + "," + d.target.y;
						} else if (lTotalLinkNum > 1) {
							var pairs = Math.floor(lTotalLinkNum / 2);
							pairs = (pairs > 1) ? pairs : 2;
							var flag = (d.linkindex % 2 == 1) ? "1" : "0";
							var flag2 = (d.linkindex % 2 == 1) ? "0" : "1";
							dr = dr
									/ (1 + (1 / lTotalLinkNum)
											* (Math.ceil(d.linkindex / pairs)
													* pairs - 1));
							curve = "M" + d.source.x + "," + d.source.y + "A"
									+ dr + "," + dr + " 0 0 "
									+ ((d.linkindex % 2 == 1) ? "1" : "0")
									+ "," + d.target.x + "," + d.target.y + "A"
									+ dr + "," + dr + " 0 0 "
									+ ((d.linkindex % 2 == 1) ? "0" : "1")
									+ "," + d.source.x + "," + d.source.y;
						}
						return curve;
					}.bind(this));
};

CodeConnect.prototype.shouldLinkShowSelected = function(d) {
	return ((this.current.dependency == undefined && this.current.downstream == undefined)
			|| (this.current.dependency != undefined && this.current.dependency == d.relationtype)
			|| (this.current.downstream != undefined && this.current.downstream == d.target.name) || (this.current.downstream != undefined && this.current.downstream == d.name));
};

CodeConnect.prototype.shouldDownstreamShowSelected = function(d) {
	return ((this.current.dependency == undefined && this.current.downstream == undefined)
			|| (this.projectName == d.name)
			|| (this.current.downstream == d.name)
			|| (this.current.dependency != undefined && this.current.dependency == d.relationtype) || (this.current.dependency == d.relationtype));
};

CodeConnect.prototype.cleanup = function() {
	console.log("cleaning old connection");
	this.update([]);
};

CodeConnect.prototype.click = function(d) {
	console.log("Node has been clicked");
};

CodeConnect.prototype.flattenAndGatherMeta = function(root) {
	var data = {}, nodes = [], links = [], source = {}, reducedNodes = [], depList = {}, depNames = [], projectList = {}, projectNames = [], i = 0, r = 0;

	function contains(arr, node) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].name == node.name && arr[i].group == node.group
					&& arr[i].version == node.version) {
				return true;
			}
		}
		return false;
	}

	function retrieveReducedNode(reducedArr, node) {
		for (var i = 0; i < reducedArr.length; i++) {
			if (reducedArr[i].name == node.name
					&& reducedArr[i].group == node.group
					&& reducedArr[i].version == node.version) {
				return reducedArr[i];
			}
		}
		return null;
	}

	function record(type, value, list, names) {
		if (list[value] == undefined) {
			list[value] = 1;
			var obj = {};
			obj[type] = (value) ? value : "UNDEFINED";
			names.push(obj);
		} else {
			list[value]++;
		}
	}

	function recurse(node) {
		if (node.children) {
			source = node;
			node.children.reduce(function(p, v) {
				recurse(v);
			}, 0);
		}
		record("dependencyType", node.relationtype, depList, depNames);
		record("downstream", node.name, projectList, projectNames);
		if (!node.id)
			node.id = ++i;
		nodes.push(node);
		if (!contains(reducedNodes, node)) {
			node.id = ++r;
			reducedNodes.push(node);
		}
	}

	function compareVersionStrings(one, two) {
		if (one == two)
			return 0;
		var onearr = one.replace(/[^.\-0-9]/g, "").split(/[-.]/);
		var twoarr = two.replace(/[^.\-0-9]/g, "").split(/[-.]/);
		for (var i = 0; i < onearr.length; i++) {
			if (Number(onearr[i]) < Number(twoarr[i]))
				return -1;
			if (Number(onearr[i]) > Number(twoarr[i]))
				return 1;
		}
		return 0;
	}


	recurse(root);
	data.dependencyListCounts = depList;
	data.dependencyNames = depNames;
	data.downstreamListCounts = projectList;
	data.downstreamNames = projectNames;
	data.outdatedprojects = [];

	var randColor = generateRandomColor();
	var updatedColor = "Green";
	var tmpColorArr = $.xcolor.analogous(randColor, depNames.length);
	data.dependencyColors = this.createColorArray(tmpColorArr, depNames,
			"dependencyType");

	tmpColorArr = $.xcolor.monochromatic(updatedColor, projectNames.length)
	data.downstreamColors = this.createColorArray(tmpColorArr, projectNames,
			"downstream");

	for (i = 0; i < nodes.length; i++) {
		var nodeOutdated = false;
		for ( var node in nodes) {
			if (nodes[node].name == nodes[i].name
					&& nodes[node].group == nodes[i].group
					&& compareVersionStrings(nodes[node].version,
							nodes[i].version) > 0) {
				nodeOutdated = true;
			}
		}
		if (!nodeOutdated && nodes[i].name && nodes[i].group) {
			var temp = isProjectOutdated(
					nodes[i].name,
					nodes[i].group,
					nodes[i].version,
					function(outdated, name, group, version) {
						if (outdated) {
							data.outdatedprojects.push("" + name + "-" + group + "-" + version + "-NODE");
						}
					});
		}
		if (nodeOutdated) {
			data.outdatedprojects.push(nodes[i].name + "-" + nodes[i].group + "-" + nodes[i].version + "-NODE");
		}
	}

	for (var i = 0; i < nodes.length; i++) {
		nodes[i].linkcolor = data.dependencyColors[nodes[i].relationtype];
		nodes[i].downstreamcolor = updatedColor;
		var link = {};
		link.source = source;
		link.target = retrieveReducedNode(reducedNodes, nodes[i]);
		link.relationtype = nodes[i].relationtype;
		link.linkcolor = data.dependencyColors[nodes[i].relationtype];
		link.downstreamcolor = data.downstreamColors[nodes[i].name];
		links.push(link);
	}
	data.nodes = nodes;
	data.links = this.sortLinks(links);
	data.reducedNodes = reducedNodes;
	return data;
};

CodeConnect.prototype.createColorArray = function(colorRange, arr, key) {
	var colors = {};
	for (var i = 0; i < arr.length; i++) {
		if (arr[i][key]) {
			colors[arr[i][key]] = colorRange[i].getHex();
		}
	}
	return colors;
};

CodeConnect.prototype.mouseover = function(d) {
	this.nodetext.style('display', null);
};

CodeConnect.prototype.mouseout = function(d) {
	if (!$("#dependency-label").is(':checked')) {
		this.nodetext.style('display', "none");
	}
};

CodeConnect.prototype.assignCurrent = function(type, value) {
	this.current = {
		dependency : undefined,
		downstream : undefined
	};
	if (type != undefined || value != undefined) {
		this.current[type] = value;
	}
	this.update()
};

CodeConnect.prototype.populateLegend = function() {
	// remove any elements already in legend
	$("#right-menu-contents").empty()
	if(! $("#separate-downstream-lines").is(":checked")){
		return;
	}
	var legendmenu = d3.select("#right-menu-contents");

	// layout dependency legend
	var depSection = legendmenu.append("h1").text("Dependencies Legend").attr(
			"id", "dependency-legend-header").append("ul");
	for (var i = 0; i < this.metadata.dependencyNames.length; i++) {
		var depName = (this.metadata.dependencyNames[i].dependencyType) ? this.metadata.dependencyNames[i].dependencyType
				: "UNDEFINED";
		var depLinkColorRGB = hexToRgb(this.metadata.dependencyColors[depName])
		var depCount = this.metadata.dependencyListCounts[depName];
		depSection.append("li")

		.append("h3").text(depName).append("input").text(depName).attr("type",
				"button").attr("class", "swatch").attr(
				"onclick",
				"javascript:currentConnection.assignCurrent(\'dependency\',\'"
						+ depName + "\')").attr(
				"style",
				"background-color: rgb(" + depLinkColorRGB.r + ", "
						+ depLinkColorRGB.g + ", " + depLinkColorRGB.b + ");");
	}
	// layout downstream objects legend
	var downstreamSection = legendmenu.append("h1").text("Downstream Legend")
			.attr("id", "downstream-legend-header").append("ul");
	for (var i = 0; i < this.metadata.downstreamNames.length; i++) {
		var downstreamName = (this.metadata.downstreamNames[i].downstream) ? this.metadata.downstreamNames[i].downstream
				: "UNDEFINED";
		var downstreamLinkColorRGB = hexToRgb(this.metadata.downstreamColors[downstreamName])
		var downstreamCount = this.metadata.dependencyListCounts[depName];
		downstreamSection.append("li").append("h3").text(downstreamName)
				.append("input").attr("type", "button").attr("class", "swatch")
				.attr(
						"onclick",
						"javascript:currentConnection.assignCurrent(\'downstream\',\'"
								+ downstreamName + "\')").attr(
						"style",
						"background-color: rgb(" + downstreamLinkColorRGB.r
								+ ", " + downstreamLinkColorRGB.g + ", "
								+ downstreamLinkColorRGB.b + ");");
	}
};

CodeConnect.prototype.sortLinks = function(links) {
	return links.sort(function(a, b) {
		// TODO assuming sources are the same for now, may need to return to
		// this for actual sorting
		if (a.source > b.source) {
			return 1;
		} else if (a.source < b.source) {
			return -1;
		} else {
			// first sort by version if name and group are the same
			if (a.target.name == b.target.name
					&& a.target.group == b.target.group
					&& a.target.version > b.target.version) {
				return 1;
			}
			if (a.target.name == b.target.name
					&& a.target.group == b.target.group
					&& a.target.version < b.target.version) {
				return -1;
			} else {
				// then sort by group if name is the same
				if (a.target.name == b.target.name
						&& a.target.group > b.target.group) {
					return 1;
				}
				if (a.target.name == b.target.name
						&& a.target.group < b.target.group) {
					return -1;
				} else {
					// finally sort by name
					if (a.target.name > b.target.name) {
						return 1;
					}
					if (a.target.name < b.target.name) {
						return -1;
					} else {
						return 0;
					}
				}
			}
		}
	});
}
CodeConnect.prototype.setLinkIndexAndNum = function(links) {
	for (var i = 0; i < links.length; i++) {
		if (i != 0 && links[i].target.name == links[i - 1].target.name
				&& links[i].target.group == links[i - 1].target.group
				&& links[i].target.version == links[i - 1].target.version) {
			links[i].linkindex = links[i - 1].linkindex + 1;
		} else {
			links[i].linkindex = 1;
		}
		// save the total number of links between two nodes
		if (this.mLinkNum[links[i].target.name + "-" + links[i].target.group
				+ "-" + links[i].target.version] !== undefined) {
			this.mLinkNum[links[i].target.name + "-" + links[i].target.group
					+ "-" + links[i].target.version] = links[i].linkindex;
		} else {
			this.mLinkNum[links[i].target.name + "-" + links[i].target.group
					+ "-" + links[i].target.version] = links[i].linkindex;
		}
	}
	console.log("end of setLinkIndexAndNum");
	console.log(this.mLinkNum);
	console.log(links);
}
