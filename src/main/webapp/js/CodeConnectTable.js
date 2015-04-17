"use strict";
var CodeConnectTable = function(selector){
		this.margin = {top: 30, right: 20, bottom: 30, left: 20};
		this.width = 960 - this.margin.left - this.margin.right;
		this.barHeight = 20;
		this.barWidth = this.width * .8;

		this.i = 0;
		this.duration = 400;
		this.root;

		this.tree = d3.layout.tree()
			.nodeSize([0, 20]);

		this.diagonal = d3.svg.diagonal()
			.projection(function(d) { return [d.y, d.x]; });

		this.svg = d3.select(selector).append("svg")
			.attr("width", this.width + this.margin.left + this.margin.right)
		.append("g")
			.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

		$(selector).css('position',"relative");
		//TODO perhaps move this into update ??
		this.populateLegend();
	};

CodeConnectTable.prototype.updateSize = function(w, h) {
		this.width = w;
		this.height = h;
		this.svg.attr('width', w).attr('height', h);
		$("body").attr('width', w).attr('height', h);
	};

CodeConnectTable.prototype.populateNodeText = function(d){
		var text = d.name;
		if( d.type ){
			if(d.type == "group"){
				text += " --- Group[" + d.group + "]";
			}
			if(d.type == "version"){
				text = "Version[" + d.version + "]";
			}
		}
		return text;
	};

CodeConnectTable.prototype.update = function(source, projectName) {
		console.log("Updating Table");
		this.margin = {top: 30, right: 20, bottom: 30, left: 20};
		this.width = 960 - this.margin.left - this.margin.right;
		this.barHeight = 20;
		this.barWidth = this.width * .8;

		if( this.root == undefined){
			this.root = this.convert(source, projectName);
		}

		var nodes = this.tree.nodes(this.root);

		var height = Math.max(500, nodes.length * this.barHeight + this.margin.top + this.margin.bottom);

		d3.select("svg").transition()
			.duration(this.duration)
			.attr("height", height);

		d3.select(self.frameElement).transition()
			.duration(this.duration)
			.style("height", height + "px");

		// Compute the "layout".
		nodes.forEach(function(n, i) {
			n.x = i * this.barHeight;
		}.bind(this));

		// Update the nodes
		var node = this.svg.selectAll("g.node")
			.data(nodes, function(d) { return d.id || (d.id = ++this.i); }.bind(this));

		var nodeEnter = node.enter().append("g")
			.attr("class", "node")
			.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
			.style("opacity", 1e-6);

		// Enter any new nodes at the parent's previous position.
		nodeEnter.append("rect")
			.attr("y", -this.barHeight / 2)
			.attr("height", this.barHeight)
			.attr("width", this.barWidth)
			.style("fill", this.color)
			.on("click", this.click.bind(this));

		nodeEnter.append("text")
			.attr("dy", 3.5)
			.attr("dx", 5.5)
			.text(this.populateNodeText);

		nodeEnter.append("text")
			.attr("class", "out_of_date_indicator")
			.attr("id", function(d){
				return ""+d.type+"_"+d.name+"_"+d.group+"_"+d.version;
			})
			.attr("dy", 3.5)
			.attr("dx", this.barWidth * .7)
			.style("visibility",function(d){
				if(d.outdated == true){
					return "visible";
				}
				return "hidden";
			})
			.text(function(d){
				if(d.type == "version"){
					var ans = "OUT OF DATE";
					if(d.newestVersion)ans += " :: "+d.newestVersion + " is newer";
					return ans;
				}
				return "Contains out of date dependency";
			})

		// Transition nodes to their new position.
		nodeEnter.transition()
			.duration(this.duration)
			.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
			.style("opacity", 1);

		node.transition()
			.duration(this.duration)
			.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
			.style("opacity", 1)
			.select("rect")
			.style("fill", this.color);

		// Transition exiting nodes to the parent's new position.
		node.exit().transition()
			.duration(this.duration)
			.attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
			.style("opacity", 1e-6)
			.remove();

		// Update the links
		var link = this.svg.selectAll("path.link")
			.data(this.tree.links(nodes), function(d) { return d.target.id; });

		// Enter any new links at the parent's previous position.
		link.enter().insert("path", "g")
			.attr("class", "link")
			.attr("d", function(d) {
				var o = {x: source.x0, y: source.y0};
				return this.diagonal({source: o, target: o});
			}.bind(this))
			.transition()
			.duration(this.duration)
			.attr("d", this.diagonal);

		// Transition links to their new position.
		link.transition()
			.duration(this.duration)
			.attr("d", this.diagonal);

		// Transition exiting nodes to the parent's new position.
		link.exit().transition()
			.duration(this.duration)
			.attr("d", function(d) {
				var o = {x: source.x, y: source.y};
				return this.diagonal({source: o, target: o});
			}.bind(this))
			.remove();

		// Stash the old positions for transition.
		nodes.forEach(function(d) {
			d.x0 = d.x;
			d.y0 = d.y;
		});

		return this;
	}

CodeConnectTable.prototype.populateLegend = function(){
		$("#right-menu-contents").empty()
		var legendmenu = d3.select("#right-menu-contents");
		//TODO add a legend
	};

CodeConnectTable.prototype.convert = function(json, projectName){
		console.log("json:");
		console.log(json);
		var containsProject = function(name, group, arr){
			for(var i = 0; i < arr.length; i++){
				if (arr[i].name == name && arr[i].group == group) {return true;}
			}
			return false;
		}
		var containsVersion = function(name, group, version, arr){
			for(var i in arr){
				if( arr[i].name == name && arr [i].group == group && arr[i].version == version){return true;}
			}
			return false;
		}
		var retrieveProject = function(name, group, arr){
			for(var i = 0; i < arr.length; i++){
				if( arr[ i ].name == name && arr[ i ].group == group){ return arr[i];}
			}
			return null;
		}
		var retrieveVersion = function(name, group, version, arr){
			for(var i = 0; i < arr.length; i++){
				if( arr[ i ].name == name && arr[ i ].group == group && arr[i].version == version){ return arr[i]; }
			}
			return null;
		}
		var nodes = {};
		nodes.name = projectName;
		nodes.type = "root";
		nodes.children=[];
		var checkOutdated = function(node, name, group, version){
			isProjectOutdated(name, group, version, function(outdated, projectName, projectGroup, projectVersion, newestVersion){
				if(outdated){
					var curr = node;
					while(curr){
						curr.outdated = true;
						var id = ""+curr.type+"_"+curr.name+"_"+curr.group+"_"+curr.version;
						var element = d3.select("#display").select("text[id='"+id+"']");
						if(element){
							element.style("visibility", "visible");
						}
						if(curr.version){
							element.text(element.text() + " :: " + newestVersion +" is newer");
							curr.newestVersion = newestVersion;
						}
						if(! curr.parent){
							break;
						}
						curr = curr.parent;
					}
				}
			});
		}
		for(var i = 0; i < json.data.length; i++){
			var versionAdded = true;
			var currentNode;
			if ( !containsProject(json.data[i][0], json.data[i][1], nodes.children) ){
				var node = {
					"name":json.data[i][0],
					"group": json.data[i][1],
					"type": "group",
					"children": [ currentNode ={ downstreamname: json.data[i][0], group: json.data[i][1], version: json.data[i][2], name:json.data[i][0], type: "version",
						"children": [{downstreamname: json.data[i][0], group: json.data[i][1], version: json.data[i][2], name:json.data[i][3], type: "dependency"}]
					} ]
				};
				nodes.children.push( node );
			}else{
				var node = retrieveProject(json.data[i][0], json.data[i][1], nodes.children);
				if( !containsVersion(json.data[i][0], json.data[i][1], json.data[i][2], node.children)){
					node.children.push(currentNode = {downstreamname: json.data[i][0], group: json.data[i][1], version: json.data[i][2], name:json.data[i][0], type: "version",
						"children": [{downstreamname: json.data[i][0], group: json.data[i][1], version: json.data[i][2], name:json.data[i][3], type: "dependency"}]
					} );
				}else{
					versionAdded = false;
					var version = retrieveVersion(json.data[i][0], json.data[i][1], json.data[i][2], node.children);
					version.children.push( {downstreamname: json.data[i][0], group: json.data[i][1], version: json.data[i][2], name:json.data[i][3], type: "dependency"} );
				}
			}
			if(versionAdded){
				checkOutdated(currentNode, json.data[i][0], json.data[i][1], json.data[i][2]);
			}
		}

		nodes.x0 = 0;
		nodes.y0 = 0;
		console.log(nodes);
		return nodes;
	};

CodeConnectTable.prototype.expandAll = function() {
	if(this.root == undefined){
		return;
	}
	var expand = function(d){
		if(d._children){
			d.children = d._children;
			d._children = null;
		}
		if(d.children){
			for(var i in d.children){
				expand(d.children[i]);
			}
		}
	};
	expand(this.root);
	this.update(this.root);
}

CodeConnectTable.prototype.collapseAll = function(d){
	var update = false;
	if(d == undefined) {
		update = true;
		d = this.root;
	}
	if(d.children){
		for(var node in d.children){
			this.collapseAll(d.children[node]);
		}
		d._children = d.children;
		d.children = null;
	}
	if(update){
		this.update(d);
	}
}
CodeConnectTable.prototype.click = function(d) {
		if (d.children) {
			this.collapseAll(d);
		} else {
			d.children = d._children;
			d._children = null;
		}
		this.update(d);
	};

CodeConnectTable.prototype.color = function(d) {
		return ( d.type == "root") ? "#668888" : (d._children ? "#5092B0" : (d.children ? "#81A594" : "#E6E6DC"));
	}