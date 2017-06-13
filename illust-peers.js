PeersIllustrator = function(chartId) {
	this.id = "illust-peers"; //Chart ID
	this.domId = (!chartId) ? this.id : chartId; //Element ID in DOM
	this.name = "Peers illustrator";
	this.minGridWdth = 2;
	this.minGridHght = 2;
	this.updateInterval = 6000;

	var _this = this;
	var grph;
	var line;
	var radius;
	var arc;
	var pie;

	var rotat = 0;
	var txtOff = 28;
	var duration = 1000;

	this.start = function() {
		//this.chartWdth *= 0.5; // >>Perspective View<<
		//this.chartHght *= 0.7; // >>Perspective View<<
		radius = Math.min(this.chartWdth*3/4, this.chartHght) / 2;

		pie = d3.layout.pie()
			.sort(null)
			.value(function(d) { return 1; });

		arc = d3.svg.arc()
			.outerRadius(radius * 0.7)
			.innerRadius(radius * 0.7);

		line = d3.svg.line();

		grph = d3.select("#"+this.domId).select(".chart-viz");
		grph.attr("viewBox", "0 0 " + this.chartWdth + " " + this.chartHght)
	};

	this.render = function(rspn) {
		// Make sure all connection lines are drawn first, so the nodes icons are drawn on top of them
		if (grph.select(".peers").empty()) {
			grph.append("g").attr("class", "peers")
				.attr("transform", "translate(" + (_this.chartWdth / 2) + ", " + (_this.chartHght / 2) + ")");
		}

		var pline = grph.select(".peer-lines");
		if (pline.empty()) {
			pline = grph.select(".peers").append("g").attr("class", "peer-lines");
		}

		var pnode = grph.select(".peer-nodes");
		if (pnode.empty()) {
			pnode = grph.select(".peers").append("g").attr("class", "peer-nodes");
		}

		// Prepare data
		rotat = Math.PI / rspn.peers.length / 2; //+= Math.PI / rspn.peers.length / 2; // >>Real network statistic<<
		//if (rotat >= 2*Math.PI) rotat = 0; // >>Real network statistic<<

		var nodes = pie(rspn.peers).map(function(d) {
				d.startAngle -= rotat;
				d.endAngle -= rotat;
				return d;
		});
		nodes.sort(function(a, b) {
				if (a.data.ID.name < b.data.ID.name)
					return -1;
				else if (a.data.ID.name > b.data.ID.name)
					return 1;
				else
					return 0;
		});

		// Get the coordinates of each node IN THE PREVIOUS ITERATION to draw the line initially
		var plast = {};
		var peers = pnode.selectAll(".peer").data(nodes, function(d) { return d.data.pkiID; });
		peers.each(function(d, i) {
				plast[d.data.ID.name] = d3.transform(d3.select(this).attr("transform")).translate;
		});

		// Work out all the points of the nodes of this iteration
		var clsss = new Set();
		var lines = [];
		for (var i = 0; i < nodes.length; i ++) {
			p0 = arc.centroid(nodes[i]);
			for (var j = 0; j < i; j ++) {
				p1 = arc.centroid(nodes[j]);
				clsss.add("f" + nodes[i].data.ID.name + " t" + nodes[j].data.ID.name);
				lines.push({"fm" : nodes[i].data.ID.name, "to" : nodes[j].data.ID.name, "points" : [p0, p1]});
			}
		}

		// Remove connection lines no longer needed
		var p0, p1, px;
		var pth = pline.selectAll(".peer-line");
		var regex = /^peer-line (f[_a-zA-Z0-9-]+ t[_a-zA-Z0-9-]+)$/;
		var lne, mth;
		pth.each(function(d, i) {
				lne = d3.select(this);
				mth = regex.exec(lne.attr("class"));
				if (mth != null) {
					if (!clsss.has(mth[1])) {
						lne.remove();
					}
				}
		});

		// Draw connection lines between the nodes
		for (var i = 0; i < lines.length; i ++) {
			px = (plast[lines[i].to]) ? plast[lines[i].to] : lines[i].points[1];
			pth = pline.select(".peer-line.f" + lines[i].fm + ".t" + lines[i].to);
			if (pth.empty()) {
				pth = pline.append("path").attr("class", "peer-line f" + lines[i].fm + " t" + lines[i].to)
					.style("stroke", colors[i % colors.length]);
				pth.attr("d", line([lines[i].points[0], px]));
			}
			pth.transition().duration(duration).attr("d", line(lines[i].points));
		}

		// Draw the nodes
		var peer = peers.enter().append("g").attr("class", "peer");
		peer.append("rect").attr("class", function(d) { return (d.data.type == 1) ? "peer-vnode" : "peer-node"; })
			.attr("x", -7).attr("y", -12).attr("width", 14).attr("height", 7);
		peer.append("line").attr("class", "peer-frme")
			.attr("x1", 0).attr("y1", -5).attr("x2", 0).attr("y2", 0);
		peer.append("line").attr("class", "peer-frme")
			.attr("x1", -8).attr("y1", 0).attr("x2", 8).attr("y2", 0);
		peer.append("text").attr("class", function(d) { return (d.data.type == 1) ? "peer-vtext" : "peer-text"; })
			.attr("text-anchor", "middle").attr("dominant-baseline", "middle")
			.text(function(d, i) { return d.data.ID.name; });

		peers.exit().remove();

		/*  >>Perspective View<<
		var max = 1.7;
		var mid = Math.floor(nodes.length / 2);
		var inc = (max - 1) / mid;
		peers.select("text")
			.style("font-size", function(d, i) {
					if (i <= mid) {
						return (max - i * inc) + "em";
					} else {
						return (max - (nodes.length - i) * inc) + "em";
					}
			}); //*/

		peers.select("text").transition().duration(duration)
			.attr("dx", function(d) { return  txtOff * Math.sin((d.endAngle - d.startAngle) / 2 + d.startAngle); })
			.attr("dy", function(d) { return -txtOff * Math.cos((d.endAngle - d.startAngle) / 2 + d.startAngle); });

		peers.transition().duration(duration)
			.attrTween("transform", function(d) {
				this._current = this._current || d;
				var intr = d3.interpolate(this._current, d);
				this._current = intr(0);
				return function(t) {
					var val = intr(t);
					var pos = arc.centroid(val);
					return "translate(" + pos + ")";
				};
		});
	};

	this.buildUi = function(func) {
		func('<div class="chart-title" style="color:#9ecf9b">Network status</div><svg class="chart-viz"/>'); // >>Perspective View<<
		//func('<div class="chart-title"></div><div style="perspective:500px"><svg class="chart-viz" style="transform:rotateX(45deg) translate(0, -200px)"/></div>');
	};

	this.fromCookie = function(cook) {
	};

	this.toCookie = function(row, col, wdth, hght) {
		var cook = {};
		cook[KEY_CHART] = this.id;
		cook[KEY_ROW] = row;
		cook[KEY_COL] = col;
		cook[KEY_WDTH] = wdth;
		cook[KEY_HGHT] = hght;
		return cook;
	};

};
PeersIllustrator.prototype = new Chart();
PeersIllustrator.prototype.constructor = PeersIllustrator;
addAvailableCharts(new PeersIllustrator());