
PeersIllustrator = function(chartId) {
	this.id = "illust-peers"; //Chart ID
	this.domId = (!chartId) ? this.id : chartId; //Element ID in DOM
	this.name = "Peers illustrator";
	this.url = "http://localhost:8080/ws/temp2"; //"%%%urlPeers%%%";
	this.minGridWdth = 3;
	this.minGridHght = 3;
	this.updateInterval = 2000;

	var radius;
	var arc;
	var pie;
	var line;

	var grph;
	var _this = this;

	this.init = function() {
		radius = Math.min(this.chartWdth*3/4, this.chartHght) / 2;

		pie = d3.layout.pie()
			.sort(null)
			.value(function(d) { return 1; });

		arc = d3.svg.arc()
			.outerRadius(radius * 0.7)
			.innerRadius(radius * 0.7);

		line = d3.svg.line();

		grph = d3.select("#"+this.domId).select(".chart-viz");
	};

	this.render = function() {
		accessData(this.url, function(rspn) {
				var prnt = grph.select(".peers");
				if (prnt.empty()) {
					prnt = grph.append("g").attr("class", "peers").attr("transform", "translate(" + (_this.chartWdth / 2) + ", " + (_this.chartHght / 2) + ")");
				}

				var nodes = pie(rspn.peers).map(function(d) {
						d.startAngle -= (Math.PI / rspn.peers.length);
						d.endAngle -= (Math.PI / rspn.peers.length);
						return d;
				});

				var peers = prnt.selectAll(".peer").data(nodes, function(d) { return d.data.pkiID; });
				var peer = peers.enter().append("g").attr("class", "peer");
				peer.append("circle").attr("class", "block-rect")
					.attr("cx", 0).attr("cy", 0).attr("r", 5)
					.each(function(d, i) {
							var p0 = arc.centroid(d);
							for (var idx = 0; idx < i; idx ++) {
								var p1 = arc.centroid(nodes[idx]);
								prnt.append("path").attr("class", "test block-rect").attr("d", line([p0, p1]));
							}
					});
				peer.append("text").attr("class", "block-text")
					.attr("dy", "16")
					.text(function(d, i) { return d.data.ID.name; });

				peers.exit().remove();

				peers.transition().duration(600)
					.attrTween("transform", function(d) {
						//d.startAngle -= (Math.PI / rspn.peers.length);
						//d.endAngle -= (Math.PI / rspn.peers.length);
						this._current = this._current || d;
						var intr = d3.interpolate(this._current, d);
						this._current = intr(0);
						return function(t) {
							var val = intr(t);
							var pos = arc.centroid(val);
							//pos[0] = radius * (val.startAngle < Math.PI ? 1 : -1);
							return "translate(" + pos + ")";
						};
				});
		});
	};

	this.buildUi = function(func) {
		func('<div class="chart-title"></div><svg class="chart-viz" />');
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