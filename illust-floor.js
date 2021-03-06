FloorIllustrator = function(chartId) {
	this.id = "illust-floor"; //Chart ID
	this.domId = (!chartId) ? this.id : chartId; //Element ID in DOM
	this.name = "Floor plan illustrator";
	this.minGridWdth = 5;
	this.minGridHght = 4;
	this.updateInterval = 4000;

	const fplan = {
		"alan":[3, 6, 1], "alex":[6, 6, 1], "andy":[2, 5, 3], "bill":[4, 3, 1], "carl":[3, 7, 1], "cole":[6, 7, 1],
		"dave":[5, 5, 3], "dale":[9, 3, 1], "dick":[6, 2, 3], "eric":[5, 7, 2], "gary":[3, 5, 0], "gene":[5, 6, 2],
		"greg":[8, 6, 2], "jack":[3, 2, 3], "john":[4, 2, 0], "josh":[9, 6, 1], "kyle":[9, 7, 1], "mark":[1, 3, 1],
		"mike":[2, 7, 2], "nick":[1, 2, 0], "paul":[8, 7, 2], "pete":[3, 3, 2], "phil":[2, 6, 2], "saul":[6, 5, 0],
		"will":[9, 5, 0], "zach":[8, 5, 3]
	};

	var gridSizeX, gridSizeY, gridSubX, gridSubY;

	var _this = this;
	var grph;

	var shapew, shape0, shape1, shape2, shape3;

	this.start = function() {
		gridSizeX = (this.chartWdth - 20) / 10;
		gridSizeY = (this.chartHght - 20) / 7;
		gridSubX = gridSizeX / 3;
		gridSubY = gridSizeY / 3;

		grph = d3.select("#"+this.domId).select(".chart-viz");

		shapew = [[0, 0].join(",")
				, [gridSizeX * 6, 0].join(",")
				, [gridSizeX * 6, gridSizeY * 2].join(",")
				, [gridSizeX * 10, gridSizeY * 2].join(",")
				, [gridSizeX * 10, gridSizeY * 7].join(",")
				, [0, gridSizeY * 7].join(",")].join(" ");
		shape0 = [[0, 0].join(",")
				, [gridSubX, 0].join(",")
				, [gridSubX, gridSubY].join(",")
				, [gridSubX * 2, gridSubY * 2].join(",")
				, [gridSizeX, gridSubY * 2].join(",")
				, [gridSizeX, gridSizeY].join(",")
				, [0, gridSizeY].join(",")].join(" ");
		shape1 = [[0, 0].join(",")
				, [gridSizeX, 0].join(",")
				, [gridSizeX, gridSubY].join(",")
				, [gridSubX * 2, gridSubY].join(",")
				, [gridSubX, gridSubY * 2].join(",")
				, [gridSubX, gridSizeY].join(",")
				, [0, gridSizeY].join(",")].join(" ");
		shape2 = [[0, 0].join(",")
				, [gridSizeX, 0].join(",")
				, [gridSizeX, gridSizeY].join(",")
				, [gridSubX * 2, gridSizeY].join(",")
				, [gridSubX * 2, gridSubY * 2].join(",")
				, [gridSubX, gridSubY].join(",")
				, [0, gridSubY].join(",")].join(" ");
		shape3 = [[gridSubX * 2, 0].join(",")
				, [gridSizeX, 0].join(",")
				, [gridSizeX, gridSizeY].join(",")
				, [0, gridSizeY].join(",")
				, [0, gridSubY * 2].join(",")
				, [gridSubX, gridSubY * 2].join(",")
				, [gridSubX * 2, gridSubY].join(",")].join(" ");

		/**** TEMP - grid lines ****
		for (var i = 1; i < 9; i ++) {
			grph.append("line").attr("class", "floor-wall").style("stroke-width", 1)
				.attr("x1", i * gridSizeX + 10).attr("y1", 10)
				.attr("x2", i * gridSizeX + 10).attr("y2", this.chartHght - 10);
		}
		for (var i = 1; i < 7; i ++) {
			grph.append("line").attr("class", "floor-wall").style("stroke-width", 1)
				.attr("x1", 10).attr("y1", i * gridSizeY + 10)
				.attr("x2", this.chartWdth - 10).attr("y2", i * gridSizeY + 10);
		}
		// **** TEMP ****/

		// Draw shade
		var x0 = gridSizeX * 6 + 25;
		var x1 = gridSizeX * 10;
		var dx = gridSizeX * 2;
		var y0 = gridSizeY * 2 + 10;
		while ((x0 - dx) < x1) {
			grph.append("line").attr("class", "floor-desk")
				.attr("x1", x0).attr("y1", y0).attr("x2", x0 - dx).attr("y2", 20);
			x0 += 15;
		}
		grph.append("rect").attr("class", "floor-fill")
			.attr("x", x1).attr("y", 20).attr("width", 21).attr("height", y0);

		// Draw floor
		grph.append("polygon").attr("class", "floor-fill")
			.attr("points", shapew).attr("shape-rendering", "geometricPrecision")
			.attr("transform", "translate(10, 10)");

		// Draw seats
		for (var key in fplan) {
			switch (fplan[key][2]) {
			case 0:
				grph.append("polygon").attr("class", "floor-desk")
					.attr("points", shape0).attr("shape-rendering", "geometricPrecision")
					.attr("transform", "translate(" + ((fplan[key][0]-1) * gridSizeX + 10) + ", " + ((fplan[key][1]-1) * gridSizeY + 10) + ")");
				break;
			case 1:
				grph.append("polygon").attr("class", "floor-desk")
					.attr("points", shape1).attr("shape-rendering", "geometricPrecision")
					.attr("transform", "translate(" + ((fplan[key][0]-1) * gridSizeX + 10) + ", " + ((fplan[key][1]-1) * gridSizeY + 10) + ")");
				break;
			case 2:
				grph.append("polygon").attr("class", "floor-desk")
					.attr("points", shape2).attr("shape-rendering", "geometricPrecision")
					.attr("transform", "translate(" + ((fplan[key][0]-1) * gridSizeX + 10) + ", " + ((fplan[key][1]-1) * gridSizeY + 10) + ")");
				break;
			case 3:
				grph.append("polygon").attr("class", "floor-desk")
					.attr("points", shape3).attr("shape-rendering", "geometricPrecision")
					.attr("transform", "translate(" + ((fplan[key][0]-1) * gridSizeX + 10) + ", " + ((fplan[key][1]-1) * gridSizeY + 10) + ")");
				break;
			}

			grph.append("g").attr("class", "seat " + key)
				.attr("transform", "translate(" + ((fplan[key][0]-1) * gridSizeX + 10) + ", " + ((fplan[key][1]-1) * gridSizeY + 10) + ")")
				.append("text").attr("class", "floor-text").attr("font-size", "0.8em").text(key)
				.attr("text-anchor", "middle").attr("dominant-baseline", "middle")
				.attr("dx", (fplan[key][2] <= 1) ? gridSizeX - gridSubX : gridSubX)
				.attr("dy", ((fplan[key][2] == 1) || (fplan[key][2] == 2)) ? gridSizeY - gridSubY : gridSubY);
		}

		// Draw walls
		grph.append("polygon").attr("class", "floor-wall").style("fill", "none")
			.attr("points", shapew).attr("shape-rendering", "geometricPrecision")
			.attr("transform", "translate(10, 10)");
	}

	var store = new Set();
	this.render = function(rspn, elapse) {
		if (!rspn || !rspn.records || (rspn.records.length <= 0)) {
			return;
		}

		for (var i = 0; i < rspn.records.length; i ++) {
			store.add(rspn.records[i]);
		}

		if (!this.shouldRun(elapse)) return;

		var values = Array.from(store);
		for (var i = 0; i < values.length; i ++) {
			grph.select("."+values[i]).select("text")
				.transition().duration(500)
				.attr('font-size', '2.5em')
				.transition().duration(3000)
				.attr('font-size', '0.8em');
		}
		store = new Set();
	};

};
FloorIllustrator.prototype = new Chart();
FloorIllustrator.prototype.constructor = FloorIllustrator;
addAvailableCharts(new FloorIllustrator());