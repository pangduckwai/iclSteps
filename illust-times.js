TimesIllustrator = function(chartId) {
	Chart.call(this);

	this.id = "illust-times"; //Chart ID
	this.domId = (!chartId) ? this.id : chartId; //Element ID in DOM
	this.name = "Transactions by time";
	this.minGridWdth = 4;
	this.minGridHght = 2;
	this.updateInterval = 2000;

	var _this = this;
	var grph;

	var timeFormat = d3.time.format("%H:%M:%S");
	var paddTop = 35, paddLft = 25, paddRgt = 10, paddBtm = 45, txtHght = 15;
	var durationX = 1500, durationY = 1000;

	var scaleX, scaleY;
	var maxCount = 0;

	// *** Called by dashboard main thread once at the begining ***
	this.start = function() {
		grph = d3.select("#"+this.domId).select(".chart-viz");
		scaleX = d3.scale.linear().range([paddLft + 10, this.chartWdth - paddRgt - 15]);
		scaleY = d3.scale.linear().range([this.chartHght - paddBtm, paddTop]);
	};

	// *** Called by dashboard main thread repeatedly ***
	this.render = function(rspn) {
		if (!rspn || !rspn.times) {
			return;
		}

		if (rspn.times.length < 2) {
			return; // Not enough data, wait for next round
		}

		for (var i = 0; i < rspn.times.length; i ++) {
			if (rspn.times[i].count > maxCount) maxCount = rspn.times[i].count;
		}

		scaleX.domain([rspn.times[0].time, rspn.times[rspn.times.length - 1].time]);
		scaleY.domain([0, maxCount]);

		var axisX = d3.svg.axis().scale(scaleX).orient("bottom").innerTickSize(-1 * (this.chartHght - paddBtm - paddTop)).outerTickSize(0)
			.ticks(20).tickFormat(function(d) { return timeFormat(new Date(d * 1000)); });
		var axisY = d3.svg.axis().scale(scaleY).orient("left").innerTickSize(-1 * (this.chartWdth - paddRgt - paddLft)).outerTickSize(0).ticks(7);

		var tickLastpos = scaleX(rspn.times[rspn.times.length - 1].time);
		var tickSpacing = tickLastpos - scaleX(rspn.times[rspn.times.length - 2].time);
		var zero = scaleY(0);

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
				.append("g").attr("class", "axis").attr("transform", "translate(0, " + zero + ")")
				.append("line").attr("class", "axis bline").attr("x1", paddLft).attr("y1", 0)
				.attr("x2", this.chartWdth - paddRgt).attr("y2", 0);
		}
		grph.select(".chorz .axis").transition().duration(durationX).ease("linear").call(axisX);
		grph.select(".chorz .axis")
			.selectAll("text")
			.attr("transform", "rotate(-40)")
			.style("text-anchor", "end");

		var bars = grph.selectAll(".bars").data(rspn.times, function(d) { return d.time; });
		var bar = bars.enter()
			.append("g").attr("class", "bars")
			.attr("transform", function(d) { return "translate(" + (tickLastpos + tickSpacing) + ", 0)"; });
		bar.append("rect").style("fill", "#b8dbe5");
		bars.exit().remove();
		bars.transition().duration(durationX).ease("linear")
			.attr("transform", function(d) { return "translate(" + scaleX(d.time) + ", 0)"; });
		bars.select("rect").transition().duration(durationY)
			.attr("x", 0).attr("y", function(d) { return scaleY(d.count); }).attr("width", 10)
			.attr("height", function(d) { return zero - scaleY(d.count); });
	};

	// *** API functions ***
	this.buildUi = function(func) {
		func('<div class="chart-title" style="color:#b8dbe5">Number of transactions by time</div><svg class="chart-viz" />');
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
TimesIllustrator.prototype = new Chart();
TimesIllustrator.prototype.constructor = TimesIllustrator;
addAvailableCharts(new TimesIllustrator());