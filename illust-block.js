
BlockIllustrator = function(chartId) {
	this.id = "block-illust"; //Chart ID
	this.domId = (!chartId) ? this.id : chartId; //Element ID in DOM
	this.name = "Blockchain illustrator";
	this.url = "http://192.168.14.130:8080/ws/temp1"; //"%%%urlChain%%%";
	this.minGridWdth = 5;
	this.minGridHght = 2;
	this.updateInterval = 2000;
	this.maxBlockDisplay = 10; // Maximum number of blocks to display at one time
	this.blockSideLength = 40; // Size of the blocks drawn
	this.selected = -1;
	this.interactiveMode = false; // Default is scorll forward as new blocks arrive

	var blockWidth;
	var yPosn;
	var scaleX;

	var chainDepth = 0;
	var blockArray = [];
	var catchUp = false;

	var grph;
	var _this = this;

	var blockHalf;
	var blockSideX;
	var blockSideY;
	var blockLineY;
	var shape1;
	var shape2;

	// *** Called by dashboard main thread once at the begining ***
	this.init = function() {
		blockWidth = this.chartWdth / this.maxBlockDisplay;
		yPosn = this.chartHght / 3;
		scaleX = d3.scale.linear().range([0, this.chartWdth - blockWidth]);
		grph = d3.select("#"+this.domId).select(".chart-viz");

		blockHalf = this.blockSideLength / 2;
		blockSideX = this.blockSideLength * 0.6;
		blockSideY = this.blockSideLength * -0.4;
		blockLineY = this.blockSideLength * 0.3;

		shape1 = [[0, 0].join(",")
				, [blockSideX, blockSideY].join(",")
				, [this.blockSideLength + blockSideX, blockSideY].join(",")
				, [this.blockSideLength + blockSideX, blockSideX].join(",")
				, [this.blockSideLength, this.blockSideLength].join(",")
				, [0, this.blockSideLength].join(",")].join(" ");
		shape2 = [[0, 0].join(",")
				, [this.blockSideLength, 0].join(",")
				, [this.blockSideLength + blockSideX, blockSideY].join(",")].join(" ");
	};

	// *** Called by dashboard main thread repeatedly ***
	this.render = function() {
		if (catchUp) {
			//console.log("Catching up, normal run interrupted"); //TODO TEMP
			return;
		}

		accessData(this.url, function(rspn) {
				if (!rspn || (rspn.length <= 0)) {
					return;
				}
				chainDepth = rspn.height;

				// *** Draw chain height text ***
				if (grph.select("#txt-hght").empty()) {
					grph.append("text").attr("id", "txt-hght").attr("class", "block-text")
					.attr("x", 10).attr("y", 20).attr("text-anchor", "left");
				}
				grph.select("#txt-hght").text("Current chain depth: " + chainDepth);

				// *** Draw the resume button ***
				if (grph.select("#btn-end").empty()) {
					grph.append("image").attr("id", "btn-end").attr("x", _this.chartWdth - 40).attr("y", 4).attr("width", 18).attr("height", 18).attr("xlink:href", IMG_PAUSE_S)
						.on("click", function() {
								if (_this.interactiveMode) {
									_this.interactiveMode = false;
									_this.selected = -1;
									_this.runNow();
									grph.selectAll(".block-slct").style("display", "none");
									grph.select("#btn-end").attr("xlink:href", IMG_PAUSE_S);
								} else {
									_this.interactiveMode = true;
									_this.selected = -1;
									_this.runNow();
									grph.selectAll(".block-slct").style("display", "none");
									grph.select("#btn-end").attr("xlink:href", IMG_PLAY_S);
								}
						})
						.on("mouseover", function() {
								grph.select("#btn-end").node().style.cursor = "pointer";
						})
						.on("mouseout", function() {
								grph.select("#btn-end").node().style.cursor = "auto";
					});
				}

				if (!_this.interactiveMode) {
					var lastVal = (blockArray.length > 0) ? blockArray[blockArray.length - 1] : -1;
					var nextVal = chainDepth - 1;
					var itr = nextVal - lastVal;
					if (itr > 100) {
						itr = 100;
						lastVal = nextVal - 100;
					}

					if (itr > 1) {
						var idx = 0;
						var dur;
						function _redraw() {
							if (idx < itr) {
								catchUp = true;
								dur = calcDuration(itr, idx ++, _this.updateInterval);
								_this.addBlock(++ lastVal);
								//console.log("Catching up", idx, itr, dur, lastVal, nextVal); //TODO TEMP
								_this.redraw(dur, _redraw, 0); // Catching up
							} else {
								catchUp = false;
								//console.log("Huh???", idx, itr, dur, lastVal, nextVal); //TODO TEMP
							}
						}
						_redraw();
					} else if (itr == 1) {
						//console.log("Normal ticking", nextVal); //TODO TEMP
						_this.addBlock(nextVal);
						_this.redraw(_this.updateInterval, function() {}, 0); // Normal ticking
					}
				}
		});
	};

	this.redraw = function(duration, callback, dirn) {
		if (blockArray.length <= this.maxBlockDisplay) {
			scaleX.domain([0, this.maxBlockDisplay - 1]);
			duration = 0;
		} else
			scaleX.domain([1, this.maxBlockDisplay]);

		// *** Draw the block chain! ***
		if (grph.select(".blocks").empty()) {
			grph.append("g").attr("class", "blocks");
		}
		var blocks = grph.select(".blocks").selectAll(".block").data(blockArray, function(d) { return d; } );

		var block;
		if (dirn < 0) {
			block = blocks.enter().insert("g").attr("class", "block");
		} else {
			block = blocks.enter().append("g").attr("class", "block");
		}

		block.attr("transform", function(d, i) { return "translate(" + scaleX(i) + ", " + yPosn + ")"; }).call(drag); // The drag handler should be attached to the element being dragged
		block.append("polygon").attr("class", "block-rect").style("display", "none")
			.attr("points", shape1);
		block.append("polyline").attr("class", "block-rect").style("display", "none")
			.attr("points", shape2);
		block.append("line").attr("class", "block-rect").style("display", "none")
			.attr("x1", this.blockSideLength).attr("y1", 0)
			.attr("x2", this.blockSideLength).attr("y2", this.blockSideLength);
		block.append("polygon").attr("class", "block-slct").style("display", "none")
			.attr("points", shape1);
		block.append("line").attr("class", "block-line").style("display", "none")
			.attr("x1", this.blockSideLength + blockLineY).attr("y1", blockLineY)
			.attr("x2", blockWidth).attr("y2", blockLineY);
		block.append("text").attr("class", "block-text").style("display", "none")
			.text(function(d) { return d; })
			.attr("x", blockHalf)
			.attr("y", blockHalf).attr("text-anchor", "middle").attr("dominant-baseline", "middle");

		// Since the <g> element (variable 'block') does not receive mouse event, add this invisible box in between the blocks to allow dragging at these places
		block.append("rect").attr("class", "overlay")
			.attr("x", this.blockSideLength + blockSideX).attr("y", blockSideY)
			.attr("width", blockWidth - this.blockSideLength - blockSideX).attr("height", this.blockSideLength - blockSideY);

		block.append("rect").attr("class", "overlay")
			.attr("x", 0).attr("y", blockSideY).attr("width", this.blockSideLength + blockSideX).attr("height", this.blockSideLength - blockSideY)
			.on("mouseover", function(d, i) {
					block.select(".block-slct").style("opacity", "0.5");
				})
			.on("mouseout", function(d, i) {
					if ((!_this.interactiveMode) || (_this.selected != d)) {
						block.select(".block-slct").style("opacity", "0.0");
					}
				})
			.on("click", function(d) {
					grph.selectAll(".block-slct").style("opacity", "0.0"); // Clear any other selections
					grph.select("#btn-end").attr("xlink:href", IMG_PLAY_S);
					_this.interactiveMode = true;
					_this.selected = d;
					_this.runNow();
					block.select(".block-slct").style("opacity", "0.5");
			});

		blocks.exit().remove(); // Remove graphical elements binded with removed data

		blocks.transition().duration(duration).ease("linear")
			.attr("transform", function(d, i) { return "translate(" + scaleX(i) + ", " + yPosn + ")"; })
			.call(endAll, function() { callback(); });

		blocks.selectAll(".block-rect, .block-line, .block-text, .block-slct").transition().delay(duration).style("display", "block");
	};

	// *** Util functions ***
	this.addBlock = function(value) {
		blockArray.push(value);
		if (blockArray.length > (this.maxBlockDisplay + 1)) {
			blockArray.shift();
		}
		return blockArray[blockArray.length - 1];
	};

	// *** Drag handler ***
	var drag = d3.behavior.drag()
		.on("dragstart", function() { d3.select(this).node().style.cursor = "ew-resize"; })
		.on("dragend", function() {
				d3.select(this).node().style.cursor = "auto";

				var pos = d3.transform(d3.select(".block").attr("transform")).translate[0];
				if (blockArray.length > (_this.maxBlockDisplay + 1)) {
					if ((blockWidth + pos) < 0) {
						blockArray.shift(); // remove the first element
					} else {
						blockArray.pop();
					}
				}
		})
		.on("drag", function(dat) {
				if (!_this.interactiveMode) {
					grph.select("#btn-end").style("display", "block");
					grph.select("#btn-end").attr("xlink:href", IMG_PLAY_S);
					_this.interactiveMode = true;
					_this.runNow();
				}
				var pos = d3.transform(d3.select(this).attr("transform")).translate[0];

				var p1, p2;
				var blks = d3.selectAll(".block");
				blks.each(function(d, i) {
						p1 = d3.transform(blks.first().attr("transform")).translate[0];
						p2 = _this.chartWdth - d3.transform(blks.last().attr("transform")).translate[0] - blockWidth;
				});

				if (p1 > 0) {
					var value = blockArray[0] - 1;
					if (value >= 0) {
						// Scroll backward
						blockArray.unshift(value);
						if (blockArray.length > (_this.maxBlockDisplay + 1)) {
							blockArray.pop();
						}
						_this.redraw(0, function() {}, -1);
					}
				} else if (p2 > 0) {
					var value = blockArray[blockArray.length - 1] + 1;
					if (value < chainDepth) {
						// Scroll forkward
						blockArray.push(value);
						if (blockArray.length > (_this.maxBlockDisplay + 2)) {
							blockArray.shift();
						}
						_this.redraw(0, function() {}, 1);
					}
				}

				blks.attr("transform", function(d, i) {
						var p = d3.transform(d3.select(this).attr("transform")).translate[0];
						if (p1 > 5) {
							return "translate(" + (p - 5) + ", " + yPosn + ")";
						} else if (p2 > 5) {
							return "translate(" + (p + 5) + ", " + yPosn + ")";
						} else {
							return "translate(" + (p + d3.event.dx) + ", " + yPosn + ")";
						}
				});
	});

	// *** API functions ***
	this.buildUi = function(func) {
		func('<div class="chart-title"></div><svg class="chart-viz" />');
	};

	this.fromCookie = function(cook) {
		if (cook) {
			this.selected = parseInt(cook["selected"]);
		}
	};

	this.toCookie = function(row, col, wdth, hght) {
		var cook = {};
		cook[KEY_CHART] = this.id;
		cook[KEY_ROW] = row;
		cook[KEY_COL] = col;
		cook[KEY_WDTH] = wdth;
		cook[KEY_HGHT] = hght;
		cook["selected"] = this.selected;
		return cook;
	};
};
BlockIllustrator.prototype = new Chart();
BlockIllustrator.prototype.constructor = BlockIllustrator;
addAvailableCharts(new BlockIllustrator());

// Only invoke the callback when all transitions of the given selection are completed
function endAll(trans, func) {
	var n = 0;
	trans
		.each(function() { ++n; })
		.each("end", function() { if (!--n) func.apply(this, arguments); });
};

function calcDuration(range, index, max) {
	if ((index == 0) || (index == (range - 1)) || (index >= range)) return max;

	var mid = range / 2;
	var idx = index + 1;
	if (index < mid) {
		return Math.floor(max / idx / idx);
	} else {
		var tmp = index - range;
		return Math.floor(max / tmp / tmp);
	}
};