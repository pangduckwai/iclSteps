NamesIllustrator = function(chartId) {
	Chart.call(this);

	this.id = "illust-names"; //Chart ID
	this.domId = (!chartId) ? this.id : chartId; //Element ID in DOM
	this.name = "Transactions by users";
	this.minGridWdth = 4;
	this.minGridHght = 2;
	this.updateInterval = 2000;

	var _this = this;
	var grph;

	var paddTop = 35, paddLft = 25, paddRgt = 10, paddBtm = 45, txtHght = 15;
	var durationY = 1000;

	var scaleX, scaleY;
	var maxCount = 0;

	// *** Called by dashboard main thread once at the begining ***
	this.start = function() {
		grph = d3.select("#"+this.domId).select(".chart-viz");
		scaleX = d3.scale.ordinal().rangeBands([paddLft, this.chartWdth - paddRgt]);
		scaleY = d3.scale.linear().range([this.chartHght - paddBtm, paddTop]);
	};

	// *** Called by dashboard main thread repeatedly ***
	this.render = function(rspn) {
		if (!rspn || !rspn.names) {
			return;
		}

		var names = [];
		for (var key in rspn.names) {
			names.push({ "name": key, "count": rspn.names[key] });
			if (rspn.names[key] > maxCount) maxCount = rspn.names[key];
		}
		names.sort(function(a, b) {
				if (a.count > b.count) return -1;
				if (a.count < b.count) return 1;
				if (a.name > b.name) return 1;
				if (a.name < b.name) return -1;
				return 0;
		});

		scaleX.domain(names.map(function(d) { return d.name; }));
		scaleY.domain([0, maxCount]);

		var axisX = d3.svg.axis().scale(scaleX).orient("bottom").innerTickSize(-1 * (this.chartHght - paddBtm - paddTop)).outerTickSize(0);
		var axisY = d3.svg.axis().scale(scaleY).orient("left").innerTickSize(-1 * (this.chartWdth - paddRgt - paddLft)).outerTickSize(0).ticks(7);

		var zero = scaleY(0);
		var wdth = scaleX.rangeBand() / 2;

		if (grph.select(".cvert.axis").empty()) {
			grph.append("g").attr("class", "cvert axis")
				.attr("transform", "translate(" + paddLft + ", 0)");
			grph.select(".cvert.axis")
				.append("text").attr("class", "ctxt").text("Count")
				.attr("text-anchor", "end")
				.attr("x", paddLft+5).attr("y", paddTop-2);
		}
		grph.select(".cvert.axis").transition().duration(durationY).call(axisY);

		if (grph.select(".chorz .axis").empty()) {
			grph.append("g").attr("class", "chorz")
				.append("g").attr("class", "axis").attr("transform", "translate(0, " + zero + ")");
				//.append("line").attr("class", "axis bline").attr("x1", paddLft).attr("y1", 0)
				//.attr("x2", this.chartWdth - paddRgt).attr("y2", 0);
		}
		grph.select(".chorz .axis").transition().duration(durationY).call(axisX);
		grph.select(".chorz .axis")
			.selectAll("text")
			.attr("transform", "rotate(-40)")
			.style("text-anchor", "end");

		var bars = grph.selectAll(".bars").data(names, function(d) { return d.name; });
		var bar = bars.enter().append("g").attr("class", "bars")
			.attr("transform", "translate(" + (this.chartWdth + 100) + ", 0)");
		bar.append("rect").attr("class", "bar").style("fill", "#ffb47c");
		bars.exit().remove();
		bars.transition().duration(durationY).attr("transform", function(d) { return "translate(" + (scaleX(d.name) + wdth) + ", 0)"; });
		bars.select(".bar").transition().duration(durationY)
			.attr("x", -5).attr("width", 10)
			.attr("y", function(d) { return scaleY(d.count); })
			.attr("height", function(d) { return zero - scaleY(d.count); });
	};

	// *** API functions ***
	this.buildUi = function(func) {
		func('<div class="chart-title" style="color:#fda45c">Number of transactions by users</div><svg class="chart-viz" />');
	};

	var superFromCookie = this.fromCookie;
	this.fromCookie = function(cook) {
		superFromCookie.call(this, cook);
		if (cook) {
			//this.selected = parseInt(cook["selected"]);
		}
	};

	var superToCookie = this.toCookie;
	this.toCookie = function(row, col, wdth, hght, intv) {
		var cook = superToCookie.call(this, row, col, wdth, hght, intv);
		//cook["selected"] = this.selected;
		return cook;
	};

};
NamesIllustrator.prototype = new Chart();
NamesIllustrator.prototype.constructor = NamesIllustrator;
addAvailableCharts(new NamesIllustrator());