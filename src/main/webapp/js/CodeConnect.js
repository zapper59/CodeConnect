var CodeConnect = function(selector, w, h) {
		this.w = w;
		this.h = h;
		this.current = {dependency:undefined, downstream:undefined};
	
		d3.select(selector).selectAll("svg").remove();
	
		this.svg = d3.select(selector).append("svg:svg")
			.attr('width', w)
			.attr('height', h);
	
		this.svg.append("svg:rect")
			.style("stroke", "#999")
			.style("fill", "#fff")
			.attr('width', w)
			.attr('height', h);
	
		this.force = d3.layout.force()
			.on("tick", this.tick.bind(this))
			//TODO make these functions vary on something
			.charge(function(d) { return -4000; })
			.linkDistance(function(d) { return 130; })
			.size([h, w]);
	};

CodeConnect.prototype.update = function(json, projectName) {
		if (json){
			this.json = json;
			this.metadata = this.flattenAndGatherMeta( this.json );
		}
		if (projectName){
			this.projectName = projectName;
		}
	
		this.json.fixed = true;
		this.json.x = this.w / 2;
		this.json.y = this.h / 2;
		
		var nodes = this.metadata.nodes;
		var links = d3.layout.tree().links(nodes);
		var total = nodes.length || 1;
		
		this.svg.selectAll("text").remove();
		
		// Restart the force layout
		this.force
			.nodes(nodes)
			.links(links)
			.gravity(Math.atan(total / 50) / Math.PI * 0.3)
			.start();
		
		//remove any previous links
		if (this.link) this.link.remove() 
		// Update the links
		this.link = this.svg.selectAll("line.link")
			.data(links, function(d) { return d.target.relationtype; });
	
		// Enter any new links
		this.link.enter().insert("svg:line", ".node")
			.attr("class", "link")
//			.attr("id", function(d) { 
//				console.log("SETTING ID :: ");
//				console.log(d.target.name)
//				console.log("looping nodes");
//				for(var i = 0; i < this.metadata.nodes.length; i++){
//					console.log("    node["+this.metadata.nodes[i].relationtype + "---" + this.metadata.nodes[i].name +"]")
//				}
//				return d.target.name;
//			}.bind(this) )
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; })
			.attr("style", function(d) { return "stroke:" + d.target.linkcolor; } );
	
		// Exit any old links.
		this.link.exit().remove();
	
		this.textlabel = this.svg.selectAll("linktext")
			.data(links, function(d) { return d.target.relationtype; } );
		
		this.textlabel.enter()//.insert("svg:g")
			.insert("svg:text").text( function(d){ return d.target.relationtype } )
				.attr("x", function(d){ return d.target.x } )
				.attr("y", function(d){ return d.target.y } )
				.attr('class', 'linktext')
				.attr('text-anchor', 'middle');
		this.textlabel.exit().remove();
		
		//remove any previous nodes
		if (this.node) this.node.remove() 
		// Update the nodes
		this.node = this.svg.selectAll("circle.node")
			.data(nodes, function(d) { return d.relationtype; });
	
		this.node.transition()
			.attr("r", function(d) { return d.children ? 30 : 15; });
	
		// Enter any new nodes
		this.node.enter().append('svg:circle')
			.attr("class", "node")
			.attr("r", function(d) { return d.children ? 30 : 15; })
			.style("fill", function (d) { return d.downstreamcolor; })
			.call(this.force.drag)
			.on("click", this.click.bind(this))
			.on("mouseover", this.mouseover.bind(this))
			.on("mouseout", this.mouseout.bind(this));
	
		// Exit any old nodes
		this.node.exit().remove();
	
		this.text = this.svg.append('svg:text').attr('class', 'nodetext').attr('dy', 0).attr('dx', 0).attr('text-anchor', 'middle');
		this.nametext = this.svg.append('svg:text').attr('class', 'nodetext').attr('dy', 0).attr('dx', 0).attr('text-anchor', 'middle');
		this.grouptext = this.svg.append('svg:text').attr('class', 'nodetext').attr('dy', 0).attr('dx', 0).attr('text-anchor', 'middle');
		this.versiontext = this.svg.append('svg:text').attr('class', 'nodetext').attr('dy', 0).attr('dx', 0).attr('text-anchor', 'middle');
		
		this.populateLegend();
	
		return this;
	};

CodeConnect.prototype.tick = function() {
	var h = this.h;
	var w = this.w;
	this.link.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; })
		.attr("style", function(d){
				return this.shouldLinkShowSelected(d)
					? "stroke:" + d.target.linkcolor  : "stroke:#C0C0C0";
			}.bind(this) )
		.attr("class", function(d){
				return this.shouldLinkShowSelected(d)
					? "link" : "unselected"; 
			}.bind(this) );
	
	if( $("#dependency-label").is(':checked') ){
		this.textlabel
		.attr("x", function(d) { return (d.target.x + d.source.x)/2; })
		.attr("y", function(d) { return (d.target.y + d.source.y)/2; })
		.attr("transform", function(d) {
			return "translate(" + 0 + "," + 0 + ")";
		})
		.style('display', null);
	}else{
		this.textlabel.style('display', "none");
	}

	this.node.attr("transform", function(d) {
			return "translate(" + Math.max(5, Math.min(w - 5, d.x)) + "," + Math.max(5, Math.min(h - 5, d.y)) + ")";
		}).attr("class", function(d){
			return (this.shouldDownstreamShowSelected(d))
				? "node" : "unselected"; 
		}.bind(this) );
	};

CodeConnect.prototype.shouldLinkShowSelected = function(d) {
		return ( (this.current.dependency == undefined && this.current.downstream == undefined)
				|| (this.current.dependency == d.target.relationtype)
				|| (this.current.downstream == d.target.name) );
	};

CodeConnect.prototype.shouldDownstreamShowSelected = function(d) {
		return ( (this.current.dependency == undefined && this.current.downstream == undefined)
				|| (this.projectName == d.name)
				|| (this.current.downstream == d.name)
				|| (this.current.dependency == d.relationtype) );
	};

CodeConnect.prototype.cleanup = function() {
		console.log("cleaning old connection");
		this.update([]);
	};

CodeConnect.prototype.click = function(d) {
		console.log("Node has been clicked");
	};


CodeConnect.prototype.flattenAndGatherMeta = function(root) {
	var data = {}, 
		nodes = [], 
		depList = {}, 
		depNames = [],
		projectList = {},
		projectNames = [],
		i = 0;

	function record(type, value, list, names){
		if( list[value] == undefined){
			list[value] = 1;
			var obj = {};
			obj[type] = (value) ? value : "UNDEFINED";
			names.push(obj);
		}else{
			list[value]++;
		}
	}
	
	function recurse(node) {
		if (node.children) {
			node.children.reduce(function(p, v) {
				recurse(v);
			}, 0);
		}
		record("dependencyType", node.relationtype, depList, depNames);
		record("downstream", node.name, projectList, projectNames);
		if (!node.id) node.id = ++i;
		nodes.push(node);
	}

	recurse(root);
	data.dependencyListCounts = depList;
	data.dependencyNames = depNames;
	data.downstreamListCounts = projectList;
	data.downstreamNames = projectNames;
	
	var randColor = generateRandomColor();
	var tmpColorArr = $.xcolor.analogous( randColor, depNames.length)
	data.dependencyColors = this.createColorArray(tmpColorArr, depNames, "dependencyType");
	
	tmpColorArr = $.xcolor.monochromatic( randColor, projectNames.length)
	data.downstreamColors = this.createColorArray(tmpColorArr, projectNames, "downstream")
	
	for(var i = 0; i < nodes.length; i++){
		nodes[i].linkcolor = data.dependencyColors[ nodes[i].relationtype ]; 
		nodes[i].downstreamcolor = data.downstreamColors[ nodes[i].name ];
	}
	data.nodes = nodes;
	return data;
	};

CodeConnect.prototype.createColorArray = function(colorRange, arr, key){
		var colors = {};
		for(var i = 0; i < arr.length; i++){
			if( arr[i][key] ){
				colors[ arr[i][key] ] = colorRange[i].getHex();
			}
		}
		return colors;
	};

CodeConnect.prototype.mouseover = function(d) {
		if( d.name ){
			this.nametext.attr('transform', 'translate(' + d.x + ',' + (d.y - 45) + ')')
			.text("Name :: " + d.name)
			.style('display', null);
		}
		if( d.group ){
			this.grouptext.attr('transform', 'translate(' + d.x + ',' + (d.y - 30) + ')')
			.text("Group :: " + d.group)
			.style('display', null);
		}
		if( d.version ){
			this.versiontext.attr('transform', 'translate(' + d.x + ',' + (d.y - 15) + ')')
			.text("Version :: " + d.version)
			.style('display', null);
		}
	};


CodeConnect.prototype.mouseout = function(d) {
		this.nametext.style('display', 'none');
		this.grouptext.style('display', 'none');
		this.versiontext.style('display', 'none');
	};

CodeConnect.prototype.assignCurrent = function(type, value){
		this.current = {dependency:undefined, downstream:undefined};
		if( type != undefined || value != undefined){
			this.current[type] = value;
		}
		this.update()
	};

CodeConnect.prototype.populateLegend = function(){
		//remove any elements already in legend
		$("#right-menu-contents").empty()
		var legendmenu = d3.select("#right-menu-contents");

		//layout dependency legend
		var depSection = legendmenu.append("h1").text("Dependencies Legend").attr("id","dependency-legend-header").append("ul");
		for(var i = 0; i < this.metadata.dependencyNames.length; i++){
			var depName = (this.metadata.dependencyNames[i].dependencyType) ? this.metadata.dependencyNames[i].dependencyType : "UNDEFINED";
			var depLinkColorRGB = hexToRgb( this.metadata.dependencyColors[depName] )
			var depCount = this.metadata.dependencyListCounts[depName];
			depSection.append("li")
			
			.append("h3").text(depName)
				.append("input").text(depName).attr("type", "button").attr("class", "swatch").attr("onclick", "javascript:currentConnection.assignCurrent(\'dependency\',\'" + depName + "\')")
				.attr("style", "background-color: rgb(" + depLinkColorRGB.r + ", " + depLinkColorRGB.g + ", " + depLinkColorRGB.b + ");");
		}
		//layout downstream objects legend
		var downstreamSection = legendmenu.append("h1").text("Downstream Legend").attr("id","downstream-legend-header").append("ul");
		for(var i = 0; i < this.metadata.downstreamNames.length; i++){
			var downstreamName = (this.metadata.downstreamNames[i].downstream) ? this.metadata.downstreamNames[i].downstream : "UNDEFINED";
			var downstreamLinkColorRGB = hexToRgb( this.metadata.downstreamColors[downstreamName] )
			var downstreamCount = this.metadata.dependencyListCounts[depName];
			downstreamSection.append("li")
			.append("h3").text(downstreamName)
				.append("input").attr("type", "button").attr("class", "swatch").attr("onclick", "javascript:currentConnection.assignCurrent(\'downstream\',\'" + downstreamName + "\')")
				.attr("style", "background-color: rgb(" + downstreamLinkColorRGB.r + ", " + downstreamLinkColorRGB.g + ", " + downstreamLinkColorRGB.b + ");");
		}
	};
