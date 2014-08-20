
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
		
		//TODO perhaps move this into update ??
		this.populateLegend();
	};

CodeConnectTable.prototype.populateNodeText = function(d){
		var text = d.name;
		if( d.children && d.group ){
			text += "      [" + d.group + "]";
		}
		return text;
	};

CodeConnectTable.prototype.update = function(source, projectName) {
		if( this.root == undefined){
			this.root = this.convert(source, projectName);
		}
	//	if( source.data != undefined){
	//		source = this.convert(source);
	//	}
		
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
	}

CodeConnectTable.prototype.populateLegend = function(){
		$("#right-menu-contents").empty()
		var legendmenu = d3.select("#right-menu-contents");
		//TODO add a legend
	};

CodeConnectTable.prototype.convert = function(json, projectName){
		//TODO Probably going to need to change this
		var contains = function(name, arr){
			for(var i = 0; i < arr.length; i++){
				if( arr[ i ].name == name ){ return true; }
			}
			return false;
		}
		var retrieve = function(name, arr){
			for(var i = 0; i < arr.length; i++){
				if( arr[ i ].name == name ){ return arr[i]; }
			}
			return null;
		}
		console.log("converting to text json");
		
		var nodes = {};
		nodes.name = projectName;
		nodes.children=[];
		for(var i = 0; i < json.data.length; i++){
			if ( !contains(json.data[i][0], nodes.children) ){
				var node = {
						"name":json.data[i][0],
						"group": json.data[i][1],
						//Notice swapping names and relationtype, below as well, TODO Fix this hack
						"children": [ { downstreamname: json.data[i][0], group: json.data[i][1], version: json.data[i][2], name:json.data[i][3] } ]
						//"children": [ { name: json.data[i][0], group: json.data[i][1], version: json.data[i][2], relationtype:json.data[i][3] } ]
				};
				nodes.children.push( node );
			}else{
				var node = retrieve(json.data[i][0], nodes.children)
				//node.children.push( {name: json.data[i][0], group: json.data[i][1], version: json.data[i][2], relationtype:json.data[i][3]} )
				node.children.push( {downstreamname: json.data[i][0], group: json.data[i][1], version: json.data[i][2], name:json.data[i][3]} )
			}
		}
		nodes.x0 = 0;
		nodes.y0 = 0;
		return nodes;
	};
	
CodeConnectTable.prototype.click = function(d) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
		this.update(d);
	};

CodeConnectTable.prototype.color = function(d) {
		return d._children ? "#00628B" : d.children ? "#81A594" : "#E6E6DC";
	};