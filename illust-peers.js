
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
	this.init = function() {
		radius = Math.min(this.chartWdth*3/4, this.chartHght) / 2;

		pie = d3.layout.pie()
			.sort(null)
			.value(function(d) { return 1; });

		arc = d3.svg.arc()
			.outerRadius(radius * 0.7)
			.innerRadius(radius * 0.7);
	};

	this.render = function() {
		var obj = this;
		accessData(this.url, function(rspn) {
				//console.log(JSON.stringify(rspn.peers[2].ID)); //TODO TEMP
				var grph = d3.select("#"+this.domId).select(".chart-viz");

				var peers = grph.selectAll(".peers").data(pie(rspn.peers), function(d) { return d.ID.name; });
				peers.enter()
					.append("g").attr("class", "peers")
					.append("text").attr("class", "block-text")
					.attr("dy", ".35em")
					.text(function(d) { console.log(d.ID.name); return d.ID.name; });

				peers.exit().remove();

				peers.transition().duration(600)
					.attrTween("transform", function(d) {
						console.log(JSON.stringify(d)); //TODO TEMP
						this._current = this._current || d;
						var intr = d3.interpolate(this._current, d);
						this._current = intr(0);
						return function(t) {
							var val = intr(t);
							var pos = arc.centroid(val);
							//pos[0] = radius * (midAngle(val) < Math.PI ? 1 : -1);
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