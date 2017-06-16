RateIllustrator = function(chartId) {
	Chart.call(this);

	this.id = "illust-brate"; //Chart ID
	this.domId = (!chartId) ? this.id : chartId; //Element ID in DOM
	this.name = "Block rate illustrator";
	this.minGridWdth = 1;
	this.minGridHght = 1;
	this.updateInterval = 2000;

	this.min = 0;
	this.max = 10;
	this.alert1 = 7;
	this.alert2 = 9;
	this.gauge = {};

	var _this = this;
	var scale;

	this.start = function() {
		scale = d3.scale.log().domain([1, 11]).range([0, 10]);

		var config = {
			size: (Math.min(this.chartWdth, this.chartHght)),
			width: this.chartWdth,
			height: this.chartHght + 20,
			min: this.min,
			max: this.max,
			minorTicks: 5
		};
		config.yellowZones = [{ from: this.alert1, to: this.alert2 }];
		config.redZones = [{ from: this.alert2, to: this.max }];

		this.gauge = new Gauge(this.domId + "Container", config);
		this.gauge.render();
	};

	this.render = function(rspn, elapse) {
		if (!this.shouldRun(elapse)) return;

		if (!rspn || !rspn.rate) {
			return;
		}

		_this.gauge.redraw(scale(rspn.rate.avg + 1), rspn.rate.avg);
	}

	this.buildUi = function(func) {
		func('<div class="chart-title" style="color:#dda700">Avg block rate</div><svg class="chart-viz gauge"/>');
	};

	var superFromCookie = this.fromCookie;
	this.fromCookie = function(cook) {
		superFromCookie.call(this, cook);
		if (cook) {
			this.min = cook["min"];
			this.max = cook["max"];
			this.alert1 = cook["alert1"];
			this.alert2 = cook["alert2"];
		}
	}

	this.config = function(element) {
		element.html("");

		var trow = element.append("tr");
		trow.append("td").style("text-align", "right").html("Minimum value");
		trow.append("td").attr("class", "cfgGauge").style("padding-left", "15px")
			.append("input").attr("type", "text").attr("class", "cfgMin").attr("name", "setting-min").style("width", "30px");

		trow = element.append("tr");
		trow.append("td").style("text-align", "right").html("Maximum value");
		trow.append("td").attr("class", "cfgGauge").style("padding-left", "15px")
			.append("input").attr("type", "text").attr("class", "cfgMax").attr("name", "setting-max").style("width", "30px");

		trow = element.append("tr");
		trow.append("td").style("text-align", "right").html("Yellow zone");
		trow.append("td").attr("class", "cfgGauge").style("padding-left", "15px")
			.append("input").attr("type", "text").attr("class", "cfgYew").attr("name", "setting-yellow").style("width", "30px");

		trow = element.append("tr");
		trow.append("td").style("text-align", "right").html("Red zone");
		trow.append("td").attr("class", "cfgGauge").style("padding-left", "15px")
			.append("input").attr("type", "text").attr("class", "cfgRed").attr("name", "setting-red").style("width", "30px");

		var obj = this;
		setTimeout(function() {
				var ctrls = d3.selectAll(".cfgGauge");
				ctrls.select(".cfgMin").node().value = obj.min;
				ctrls.select(".cfgMax").node().value = obj.max;
				ctrls.select(".cfgYew").node().value = obj.alert1;
				ctrls.select(".cfgRed").node().value = obj.alert2;
		}, 70);
	};

	this.configed = function(domId, func) {
		if (domId == this.domId) {
			var lmin = parseInt(d3.select(".cfgMin").node().value);
			var lmax = parseInt(d3.select(".cfgMax").node().value);
			var lyew = parseInt(d3.select(".cfgYew").node().value);
			var lred = parseInt(d3.select(".cfgRed").node().value);
			if ((lmin >= lyew) || (lyew >= lred) || (lred >= lmax)) {
				alert("Invalid ranges");
			} else {
				this.min = lmin;
				this.max = lmax;
				this.alert1 = lyew;
				this.alert2 = lred;

				var elm = d3.select("#" + this.domId + "Container").select("svg");
				elm.selectAll("path").remove();
				elm.selectAll("line").remove();
				elm.selectAll("text").remove();
				elm.selectAll(".pointerContainer").remove();
				if (domId != this.id) {
					this.start();
				}

				func();
			}
		}
	};

	var superToCookie = this.toCookie;
	this.toCookie = function(row, col, wdth, hght, intv) {
		var cook = superToCookie.call(this, row, col, wdth, hght, intv);
		cook["min"] = parseInt(this.min);
		cook["max"] = parseInt(this.max);
		cook["alert1"] = parseInt(this.alert1);
		cook["alert2"] = parseInt(this.alert2);
		return cook;
	};
};
RateIllustrator.prototype = new Chart();
RateIllustrator.prototype.constructor = RateIllustrator;
addAvailableCharts(new RateIllustrator());

function Gauge(placeholderName, configuration) {
	this.placeholderName = placeholderName;
	
	var self = this; // for internal d3 functions
	
	this.configure = function(configuration) {
		this.config = configuration;
		
		this.config.size = this.config.size * 0.9;
		
		this.config.raduis = this.config.size * 0.97 / 2;
		this.config.cx = this.config.width / 2;
		this.config.cy = this.config.height / 2;
		
		this.config.min = undefined != configuration.min ? configuration.min : 0; 
		this.config.max = undefined != configuration.max ? configuration.max : 100; 
		this.config.range = this.config.max - this.config.min;
		
		this.config.majorTicks = configuration.majorTicks || 5;
		this.config.minorTicks = configuration.minorTicks || 2;
		
		this.config.greenColor 	= configuration.greenColor || "#109618";
		this.config.yellowColor = configuration.yellowColor || "#555555";
		this.config.redColor 	= configuration.redColor || "#777777";
		
		this.config.transitionDuration = configuration.transitionDuration || 500;
	}

	this.render = function() {
		//this.body = d3.select("#" + this.placeholderName)
		//					.append("svg:svg")
		//					.attr("class", "gauge")
		this.body = d3.select("#"+this.placeholderName).select(".chart-viz")
							.attr("viewBox", "0 0 " + this.config.width + " " + this.config.height)
							.attr("preserveAspectRatio", "xMidYMin meet");
		
		/*this.body.append("svg:circle")
					.attr("cx", this.config.cx)
					.attr("cy", this.config.cy)
					.attr("r", this.config.raduis)
					.style("fill", "#ccc")
					.style("stroke", "#000")
					.style("stroke-width", "0.5px");
					
		this.body.append("svg:circle")
					.attr("cx", this.config.cx)
					.attr("cy", this.config.cy)
					.attr("r", 0.9 * this.config.raduis)
					.style("fill", "#fff")
					.style("stroke", "#e0e0e0")
					.style("stroke-width", "2px");*/
					
		for (var index in this.config.greenZones) {
			this.drawBand(this.config.greenZones[index].from, this.config.greenZones[index].to, self.config.greenColor);
		}
		
		for (var index in this.config.yellowZones) {
			this.drawBand(this.config.yellowZones[index].from, this.config.yellowZones[index].to, self.config.yellowColor);
		}
		
		for (var index in this.config.redZones) {
			this.drawBand(this.config.redZones[index].from, this.config.redZones[index].to, self.config.redColor);
		}
		
		if (undefined != this.config.label) {
			var fontSize = Math.round(this.config.size / 9);
			this.body.append("svg:text")
						.attr("x", this.config.cx)
						.attr("y", this.config.cy / 2 + fontSize / 2)
						.attr("dy", fontSize / 2)
						.attr("text-anchor", "middle")
						.text(this.config.label)
						.style("font-size", fontSize + "px")
						.style("fill", "#333")
						.style("stroke-width", "0px");
		}
		
		var fontSize = Math.round(this.config.size / 18);
		var majorDelta = this.config.range / (this.config.majorTicks - 1);
		for (var major = this.config.min; major <= this.config.max; major += majorDelta) {
			var minorDelta = majorDelta / this.config.minorTicks;
			for (var minor = major + minorDelta; minor < Math.min(major + majorDelta, this.config.max); minor += minorDelta) {
				var point1 = this.valueToPoint(minor, 0.75);
				var point2 = this.valueToPoint(minor, 0.85);
				
				this.body.append("svg:line")
							.attr("x1", point1.x)
							.attr("y1", point1.y)
							.attr("x2", point2.x)
							.attr("y2", point2.y)
							.style("stroke", "#dda700")
							.style("stroke-width", "1px");
			}
			
			var point1 = this.valueToPoint(major, 0.7);
			var point2 = this.valueToPoint(major, 0.85);	
			
			this.body.append("svg:line")
						.attr("x1", point1.x)
						.attr("y1", point1.y)
						.attr("x2", point2.x)
						.attr("y2", point2.y)
						.style("stroke", "#dda700")
						.style("stroke-width", "2px");
			
			if (major == this.config.min || major == this.config.max) {
				var point = this.valueToPoint(major, 0.63);
				
				this.body.append("svg:text")
				 			.attr("x", point.x)
				 			.attr("y", point.y)
				 			.attr("dy", fontSize / 3)
				 			.attr("text-anchor", major == this.config.min ? "start" : "end")
				 			.text(major)
				 			.style("font-size", fontSize + "px")
							.style("fill", "#ffffff")
							.style("stroke-width", "0px");
			}
		}
		
		var pointerContainer = this.body.append("svg:g").attr("class", "pointerContainer");
		
		var midValue = (this.config.min + this.config.max) / 2;
		
		var pointerPath = this.buildPointerPath(midValue);
		
		var pointerLine = d3.svg.line()
									.x(function(d) { return d.x })
									.y(function(d) { return d.y })
									.interpolate("basis");
		
		pointerContainer.selectAll("path")
							.data([pointerPath])
							.enter()
								.append("svg:path")
									.attr("d", pointerLine)
									.style("fill", "#999999")
									.style("stroke", "#ffffff")
									.style("fill-opacity", 0.7)
					
		pointerContainer.append("svg:circle")
							.attr("cx", this.config.cx)
							.attr("cy", this.config.cy)
							.attr("r", 0.12 * this.config.raduis)
							.style("fill", "#000000")
							.style("stroke", "#777")
							.style("opacity", 1);
		
		var fontSize = Math.round(this.config.size / 10);
		pointerContainer.selectAll("text")
							.data([midValue])
							.enter()
								.append("svg:text")
									.attr("x", this.config.cx)
									.attr("y", this.config.cy + 30) //this.config.size - this.config.cy / 4 - fontSize)
									.attr("dy", fontSize / 2)
									.attr("text-anchor", "middle")
									.style("font-size", fontSize + "px")
									.style("fill", "#ffffff")
									.style("stroke-width", "0px");
		
		this.redraw(this.config.min, this.config.min, 0);
	}
	
	this.buildPointerPath = function(value) {
		var delta = this.config.range / 13;
		
		var head = valueToPoint(value, 0.85);
		var head1 = valueToPoint(value - delta, 0.12);
		var head2 = valueToPoint(value + delta, 0.12);
		
		var tailValue = value - (this.config.range * (1/(270/360)) / 2);
		var tail = valueToPoint(tailValue, 0.28);
		var tail1 = valueToPoint(tailValue - delta, 0.12);
		var tail2 = valueToPoint(tailValue + delta, 0.12);
		
		return [head, head1, tail2, tail, tail1, head2, head];
		
		function valueToPoint(value, factor)
		{
			var point = self.valueToPoint(value, factor);
			point.x -= self.config.cx;
			point.y -= self.config.cy;
			return point;
		}
	}
	
	this.drawBand = function(start, end, color) {
		if (0 >= end - start) return;
		
		this.body.append("svg:path")
					.style("fill", color)
					.attr("d", d3.svg.arc()
						.startAngle(this.valueToRadians(start))
						.endAngle(this.valueToRadians(end))
						.innerRadius(0.70 * this.config.raduis)
						.outerRadius(0.85 * this.config.raduis))
					.attr("transform", function() { return "translate(" + self.config.cx + ", " + self.config.cy + ") rotate(270)" });
	}
	
	this.redraw = function(value, display, transitionDuration) {
		var pointerContainer = this.body.select(".pointerContainer");
		
		pointerContainer.selectAll("text").text(display.toFixed(2) + "/s");
		
		var pointer = pointerContainer.selectAll("path");
		pointer.transition()
					.duration(undefined != transitionDuration ? transitionDuration : this.config.transitionDuration)
					//.delay(0)
					//.ease("linear")
					//.attr("transform", function(d) 
					.attrTween("transform", function() {
						var pointerValue = value;
						if (value > self.config.max) pointerValue = self.config.max + 0.02*self.config.range;
						else if (value < self.config.min) pointerValue = self.config.min - 0.02*self.config.range;
						var targetRotation = (self.valueToDegrees(pointerValue) - 90);
						var currentRotation = self._currentRotation || targetRotation;
						self._currentRotation = targetRotation;
						
						return function(step) 
						{
							var rotation = currentRotation + (targetRotation-currentRotation)*step;
							return "translate(" + self.config.cx + ", " + self.config.cy + ") rotate(" + rotation + ")"; 
						}
					});
	}
	
	this.valueToDegrees = function(value) {
		// thanks @closealert
		//return value / this.config.range * 270 - 45;
		return value / this.config.range * 270 - (this.config.min / this.config.range * 270 + 45);
	}
	
	this.valueToRadians = function(value) {
		return this.valueToDegrees(value) * Math.PI / 180;
	}
	
	this.valueToPoint = function(value, factor) {
		return { 	x: this.config.cx - this.config.raduis * factor * Math.cos(this.valueToRadians(value)),
					y: this.config.cy - this.config.raduis * factor * Math.sin(this.valueToRadians(value)) 		};
	}
	
	// initialization
	this.configure(configuration);	
}