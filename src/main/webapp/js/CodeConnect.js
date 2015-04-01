var CodeConnect = function(selector, w, h) {
	this.w = w;
	this.h = h;
	this.mLinkNum = {};
	this.current = {
		dependency : undefined,
		downstream : undefined
	};
	this.selectedNode = null;
	$(selector).css("position", "fixed");
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

	this.updatedColor = "#00A3C7";
	this.outdatedColor = "#FF6600";
	this.linkColor = "#0064B5";
};

CodeConnect.prototype.updateSize = function(w, h) {
	this.w = w;
	this.h = h;
	this.svg.attr('width', w).attr('height', h);
	this.svg.select("rect").attr('width', w).attr('height', h);
	this.force.size([ w, h ]);
	this.force.start();
	// TODO: Re-center web
};
CodeConnect.prototype.update = function(json, projectName) {
	console.log("Updating Connection");
	console.log(json);
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
	var showOutOfDate = true;
	var showUpToDate = true;
	if($("#limitselect").val() == "outofdate")
		showUpToDate = false;
	if($("#limitselect").val() == "uptodate")
		showOutOfDate = false;
	this.showOutOfDate = showOutOfDate;
	this.showUpToDate = showUpToDate;
	var tnodes, tlinks;
	if($("#show-versions-separately").is(":checked")){
		tnodes = this.metadata.reducedNodes;
		tlinks = this.metadata.links;
		$("#separate-downstream-lines").parent().show();
		$("#downstream-label").parent().show();
	}
	else{
		tnodes = this.metadata.projectNodes;
		tlinks = this.metadata.projectLinks;
		$("#separate-downstream-lines").parent().hide();
		$("#downstream-label").parent().hide();
	}
	var nodes = [], links = [];
	$.each(tnodes, function(i, d){
		if((d.outdated && showOutOfDate) || (!d.outdated && showUpToDate) || d.children)
			nodes.push(d);
	});
	$.each(tlinks, function(i, d){
		if(d.target.outdated && showOutOfDate || !d.target.outdated && showUpToDate)
			links.push(d);
	});
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
				return "stroke:" + this.linkcolor;
			});

	if (this.circle)
		this.circle.remove();

	this.circle = this.svg.append("svg:g").selectAll("circle").data(
			this.force.nodes()).enter().append("svg:circle").attr("r",
			function(d) {
				return d.children ? 20 : 10;
			}).attr("style", function(d) {
		return "fill:" + this.updatedColor;
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

	if ($("#downstream-label").is(':checked') && $("#separate-downstream-lines").is(":checked")) {
		this.curvepathtext.style('display', null);
	} else {
		this.curvepathtext.style('display', "none");
	}


	if($("#show-versions-separately").is(":checked")){
		this.nodetext.append("svg:text").attr("x", 12).attr("y", ".31em").attr(
				"class", "shadow").text(function(d) {
			return d.name
				+ ((d.version)?"--[" + d.version + "]":"");
		});

		this.nodetext.append("svg:text").attr("x", 12).attr("y", ".31em").attr(
				"class", "light").text(function(d) {
			return d.name
				+ ((d.version)?"--[" + d.version + "]":"");
		});
	}else{
		this.nodetext.append("svg:text").attr("x", 12).attr("y", ".31em").attr(
				"class", "shadow").text(function(d) {
			return d.name
				+ (d.versions ? "--[" + (d.versions.length > 1?d.versions.length + " Versions"
						:d.versions[0]) + "]":"");
		});

		this.nodetext.append("svg:text").attr("x", 12).attr("y", ".31em").attr(
				"class", "light").text(function(d) {
			return d.name
				+ (d.versions ? "--[" + (d.versions.length > 1?d.versions.length + " Versions"
						:d.versions[0]) + "]":"");
		});
	}

	this.nodetext.append("svg:text").attr("x", 12).attr("y", ".31em").text(
		function(d) {
			return d.name;
		}
	);

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

	this.nodetext.attr("style", function(d){
		if((d.outdated && !this.showOutOfDate || !d.outdated && !this.showUpToDate) && !d.children)return "visibility: hidden";
	}.bind(this)).attr("transform", function(d) {
		return "translate(" + d.x + "," + d.y + ")";
	});

	this.circle.attr(
			"style",
			function(d) {
				var ans;
				if (d.x < 5)
					d.x = 5;
				if (d.x > w - 5)
					d.x = w - 5;
				if (d.y < 5)
					d.y = 5;
				if (d.y > h - 5)
					d.y = h - 5;
				if(d.outdated)
					ans = "fill: " + this.outdatedColor;
				else
					ans =  "fill: " + this.updatedColor;
				if((d.outdated && !this.showOutOfDate || !d.outdated && !this.showUpToDate) && !d.children)ans += "; visibility: hidden";
				return ans;
			}.bind(this)).attr("transform", function(d) {
		return "translate(" + d.x + "," + d.y + ")";
	});

	this.path
			.attr(
					"style",
					function(d) {
						var ans;
						if(!this.shouldLinkShowSelected(d))ans = "stroke: silver";
						else if($("#show-versions-separately").is(":checked") && $("#separate-downstream-lines").is(":checked"))ans = "stroke: " + d.color;
						else ans = "stroke: " + this.linkColor;
						if(d.target.outdated && !this.showOutOfDate || !d.target.outdated && !this.showUpToDate)ans += "; visibility: hidden";
						return ans;
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
	this.update();
};

CodeConnect.prototype.click = function(d) {
	console.log("Node has been clicked");
	if(d.name != this.projectName)
		this.selectedNode = d;
	this.populateLegend();
};

CodeConnect.prototype.flattenAndGatherMeta = function(root) {
	var data = {}, nodes = [], links = [], projectLinks=[], source = {}, reducedNodes = [], projectNodes=[], depList = {}, depNames = [], projectList = {}, projectNames = [], i = 0, r = 0;

	function contains(arr, node) {
		var ans = false;
		$.each(arr, function(i, val){
			if (val.name == node.name && val.group == node.group
					&& val.version == node.version) {
				return ans = true;
			}
		});
		return ans;
	}

	function indexOfProject(arr, node) {
		var ans = -1;
		$.each(arr, function(i, val){
			if(val.name == node.name && val.group == node.group){
				return ans = i;
			}
		});
		return ans;
	}

	function retrieveReducedNode(reducedArr, node) {
		var ans = null;
		$.each(reducedArr, function(i, val){
			if (val.name == node.name
					&& val.group == node.group
					&& val.version == node.version) {
				return ans = val;
			}
		});
		return ans;
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

	function populateProjectNodes(nodesToUse) {
		$.each(nodesToUse, function(i, val){
			var index = indexOfProject(projectNodes, val);
			if(index == -1){
				projectNodes.push(val);
				index = projectNodes.length - 1;
				projectNodes[index].versions = [];
			}
			projectNodes[index].versions.push(val.version);
		});
	}

	recurse(root);
	if(root.versions)
		source.version = root.versions[0];
	populateProjectNodes(reducedNodes);
	data.dependencyListCounts = depList;
	data.dependencyNames = depNames;
	data.downstreamListCounts = projectList;
	data.downstreamNames = projectNames;
	data.outdatedprojects = [];

	var tmpColorArr = $.xcolor.analogous(this.updatedColor, depNames.length);
	data.dependencyColors = this.createColorArray(tmpColorArr, depNames,
			"dependencyType");
	var checkOutdated = function(n, g, v, cc){
		isProjectOutdated(n, g, v, function(outdated, name, group, version, newestVersion) {
			if (outdated) {
				data.outdatedprojects.push("" + name + "-" + group + "-" + version + "-NODE");
				var changed = false;
				$.each(reducedNodes, function(i, val){
					if(!val.outdated && val.name == name && val.group == group && val.version == version){
						val.outdated = true;
						val.newestVersion = newestVersion;
						changed = true;
					}
				});
				$.each(projectNodes, function(i, val){
					if(!val.outdated && val.name == name){
						val.outdated = true;
						val.newestVersion = newestVersion;
						changed = true;
					}
				});
				if(changed)
					cc.update();
			}
		});
	}
	for (i = 0; i < nodes.length; i++) {
		var nodeOutdated = false;
		var newest = nodes[i].version;
		$.each(reducedNodes, function(x, val){
			if(reducedNodes[x].name == nodes[i].name
					&& reducedNodes[x].group == nodes[i].group
					&& reducedNodes[x].version == nodes[i].version
					&& reducedNodes[x].outdated == true){
				nodeOutdated = true;
				newest = reducedNodes[x].newestVersion;
				return;
			}
		});
		if(!nodeOutdated){
			$.each(nodes, function(x, val){
				if (val.name == nodes[i].name
						&& val.group == nodes[i].group
						&& compareVersionStrings(val.version,
								nodes[i].version) > 0) {
					nodeOutdated = true;
					newest = val.newestVersion;
					return;
				}
			});
			if (!nodeOutdated && nodes[i].name && nodes[i].group) {
				checkOutdated(nodes[i].name, nodes[i].group, nodes[i].version, this);
			}
			if (nodeOutdated) {
				data.outdatedprojects.push(nodes[i].name + "-" + nodes[i].group + "-" + nodes[i].version + "-NODE");
				$.each(reducedNodes, function(x, val){
					if(val.name == nodes[i].name
							&& val.group == nodes[i].group
							&& val.version == nodes[i].version){
						val.outdated = true;
						val.newestVersion = newest;
					}
				});
				$.each(projectNodes, function(x, val){
					if(val.name == nodes[i].name && val.group == nodes[i].group){
						val.outdated = true;
						val.newestVersion = newest;
					}
				});
			}
		}
	}

	$.each(projectNodes, function(i, val){
		if(val.name != source.name){
			var link = {};
			link.source = source;
			link.target = val;
			projectLinks.push(link);
		}
	});
	$.each(nodes, function(i, val){
		if(val.name != source.name){
			var link = {};
			link.source = source;
			link.target = retrieveReducedNode(reducedNodes, val);
			link.relationtype = val.relationtype;
			link.color = data.dependencyColors[val.relationtype];
			links.push(link);
		}
	});

	data.nodes = nodes;
	data.links = this.sortLinks(links);
	data.projectLinks = this.sortLinks(projectLinks)
	data.reducedNodes = reducedNodes;
	data.projectNodes = projectNodes;
	return data;
};

CodeConnect.prototype.createColorArray = function(colorRange, arr, key) {
	var colors = {};
	$.each(arr, function(i, val){
		if (val[key]) {
			colors[val[key]] = colorRange[i].getHex();
		}
	});
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
	this.update();
};

CodeConnect.prototype.populateLegend = function() {
	// remove any elements already in legend
	$("#right-menu-contents").empty()
	var legendmenu = d3.select("#right-menu-contents");
	if($("#separate-downstream-lines").is(":checked") && $("#show-versions-separately").is(":checked")){
		// layout dependency legend
		var depSection = legendmenu.append("h1").text("Dependencies Legend")
				.attr("id", "dependency-legend-header").append("ul");
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
	}
	if(this.selectedNode != null){
		if($("#show-versions-separately").is(":checked")){
			var nodeSection = legendmenu.append("h1").text("Selected Node Details:").append("ul");
			nodeSection.append("li").append("h3").text("Name: " + this.selectedNode.name);
			nodeSection.append("li").append("h3").text("Group: " + this.selectedNode.group);
			nodeSection.append("li").append("h3").text("Version: " + this.selectedNode.version);
			if(this.selectedNode.outdated)
				nodeSection.append("li").append("h3").text("Newest Version: " + this.selectedNode.newestVersion);
			var found = [];
			for(var i in this.metadata.links){
				if(this.metadata.links[i].target.name == this.selectedNode.name
						&& this.metadata.links[i].target.group == this.selectedNode.group
						&& this.metadata.links[i].target.version == this.selectedNode.version){
					found.push(this.metadata.links[i].relationtype);
				}
			}
			found.sort();
			var depSection = nodeSection.append("li").append("h3").text("Configurations: "+found.length).append("ul");
			for(var i in found){
				depSection.append("li").append("h3").text(found[i]);
			}
		}
		else{
			var nodeSection = legendmenu.append("h1").text("Selected Node Details:").append("ul");
			nodeSection.append("li").append("h3").text("Name: " + this.selectedNode.name);
			nodeSection.append("li").append("h3").text("Group: " + this.selectedNode.group);
			var found = [];
			if(this.selectedNode.versions){
				if(this.selectedNode.versions.length > 1){

					$.each(this.selectedNode.versions, function(i, val){
						found.push(val);
					});
					found.sort(function(a,b){return -1*compareVersionStrings});
					var depSection = nodeSection.append("li").append("h3").text("Versions: " + this.selectedNode.versions.length).append("ul");
					found.forEach(function(i){
						depSection.append("li").append("h3").text(i);
					});
				}
				else{
					nodeSection.append("li").append("h3").text("Version: " + this.selectedNode.versions[0]);
				}
			}
			if(this.selectedNode.outdated)
				nodeSection.append("li").append("h3").text("Newest Version: " + this.selectedNode.newestVersion);
			found = [];
			for(var i in this.metadata.links){
				var val = this.metadata.links[i];
				if(val.target.name == this.selectedNode.name
						&& val.target.group == this.selectedNode.group
						&& $.inArray(val.relationtype, found) == -1){
					found.push(val.relationtype);
				}
			}
			found.sort();
			depSection = nodeSection.append("li").append("h3").text("Configurations: "+found.length).append("ul");
			found.forEach(function(i){
				depSection.append("li").append("h3").text(i);
			});
		}
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
					&& compareVersionStrings(a.target.version, b.target.version) > 0) {
				return 1;
			}
			if (a.target.name == b.target.name
					&& a.target.group == b.target.group
					&& compareVersionStrings(a.target.version, b.target.version) > 0) {
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
}
