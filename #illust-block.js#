
const MAX_BLOCK_DSP = 10;

const BLOCK_SIDE_LEN = 40;
const BLOCK_SIDE_HLF = BLOCK_SIDE_LEN / 2;
const BLOCK_SIDE_X = 0.6 * BLOCK_SIDE_LEN;
const BLOCK_SIDE_Y = -0.4 * BLOCK_SIDE_LEN;
const BLOCK_LINE_Y = 0.3 * BLOCK_SIDE_LEN;

const poly1 =
	 [[0, 0].join(",")
	, [BLOCK_SIDE_X, BLOCK_SIDE_Y].join(",")
	, [BLOCK_SIDE_LEN + BLOCK_SIDE_X, BLOCK_SIDE_Y].join(",")
	, [BLOCK_SIDE_LEN, 0].join(",")].join(" ");
const poly2 =
	 [[BLOCK_SIDE_LEN, 0].join(",")
	, [BLOCK_SIDE_LEN + BLOCK_SIDE_X, BLOCK_SIDE_Y].join(",")
	, [BLOCK_SIDE_LEN + BLOCK_SIDE_X, BLOCK_SIDE_X].join(",")
	, [BLOCK_SIDE_LEN, BLOCK_SIDE_LEN].join(",")].join(" ");
const poly3 =
	 [[0, 0].join(",")
	, [BLOCK_SIDE_X, BLOCK_SIDE_Y].join(",")
	, [BLOCK_SIDE_LEN + BLOCK_SIDE_X, BLOCK_SIDE_Y].join(",")
	, [BLOCK_SIDE_LEN + BLOCK_SIDE_X, BLOCK_SIDE_X].join(",")
	, [BLOCK_SIDE_LEN, BLOCK_SIDE_LEN].join(",")
	, [0, BLOCK_SIDE_LEN].join(",")].join(" ");

d3.selection.prototype.first = function() {
	return d3.select(this[0][0]);
};
d3.selection.prototype.last = function() {
	return d3.select(this[0][this.size() - 1]);
};

BlockIllustrator = function(chartId) {
	this.id = "block-illust"; //Chart ID
	this.domId = (!chartId) ? this.id : chartId; //Element ID in DOM
	this.name = "Blockchain illustrator";
	this.url = "http://192.168.14.130:8080/ws/temp1"; //"%%%urlChain%%%";
	this.minGridWdth = 5;
	this.minGridHght = 2;
	this.updateInterval = 2000;

	this.selected = -1;
	this.displayTo = -1; // Meaning always select the latest block

	var blockWidth;
	var yPosn;

	var chainDepth = 0;
	var blockArray = [0];
	var blockPos1st = -100;
	var blockPosLst = -100;
	var catchUp = false;

	this.init = function() {
		blockWidth = this.chartWdth / MAX_BLOCK_DSP;
		yPosn = this.chartHght / 3;
	};

	// *** Called by dashboard main thread
	this.render = function() {
		if (catchUp) {
			console.log("Catching up, normal run interrupted"); //TODO TEMP
			return;
		}

		var obj = this;
		accessData(this.url, function(rspn) {
				if (!rspn || (rspn.length <= 0)) {
					return;
				}
				chainDepth = rspn.height;

				var grph = d3.select("#"+obj.domId).select(".chart-viz");

				// *** Draw chain height text ***
				if (grph.select("#txt-hght").empty()) {
					grph.append("text").attr("id", "txt-hght").attr("class", "block-text")
					.attr("x", 10).attr("y", 20).attr("text-anchor", "left");
				}
				grph.select("#txt-hght").text("Current chain depth: " + chainDepth);

				// *** Draw the resume button ***
				if (grph.select("#btn-end").empty()) {
					grph.append("image").attr("id", "btn-end").attr("x", obj.chartWdth - 40).attr("y", 4).attr("width", 18).attr("height", 18)
						.attr("xlink:href", IMG_TOEND).style("display", "none")
						.on("click", function() {
								obj.selected = -1;
								obj.displayTo = -1;
								obj.runNow();
								grph.selectAll(".block-slct").style("display", "none");
								grph.select("#btn-end").style("display", "none");
						})
						.on("mouseover", function() {
								grph.select("#btn-end").node().style.cursor = "pointer";
						})
						.on("mouseout", function() {
								grph.select("#btn-end").node().style.cursor = "auto";
					});
				}

				if (obj.displayTo < 0) { // if >= 0 means interactive mode, only update latest chain depth
					var lastVal = blockArray[blockArray.length - 1];
					var nextVal = chainDepth - 1;
					var itr = nextVal - lastVal;

					if (itr > 1) {
						var idx = 0;
						var dur = 1000;
						function _redraw() {
							if (idx < itr) {
								if (idx == (itr - 1)) {
									catchUp = false;
									dur = 1000; // slow down scroll nearing the end of catching up
								} else {
									catchUp = true;
									if (idx == (itr - 2))
										dur = 500;
									else if (idx == (itr - 3))
										dur = 250;
									else if (idx == (itr - 4))
										dur = 125;
									else {
										dur -= 200; // accelerate scroll when catching up initially
										if (dur < 200) dur = 20;
									}
								}

								idx ++;
								obj.addBlock(++ lastVal);
//								console.log("Catching up", JSON.stringify(blockArray)); //TODO TEMP
								obj.redraw(dur, _redraw); // Catching up
							} else {
								catchUp = false;
							}
						}
						_redraw();
					} else if (itr == 1) {
						obj.addBlock(nextVal);
						obj.redraw(2000, function() {} ); // Normal ticking
					}
				}
				//console.log(blockArray); //TODO TEMP
		});
	};

	this.redraw = function(duration, callback, dirn) {
		var obj = this;
		var grph = d3.select("#"+obj.domId).select(".chart-viz");

		var scaleX = d3.scale.linear()
			.domain((blockArray.length < (MAX_BLOCK_DSP + 1)) ? [0, 9] : [blockArray[1], blockArray[MAX_BLOCK_DSP]])
			.range([0, this.chartWdth - blockWidth]);

		// *** Drag handler ***
		var drag = d3.behavior.drag()
			.on("drag", function(dat) {
					if (obj.displayTo < 0) {
						grph.select("#btn-end").style("display", "block");
						obj.displayTo = blockArray[blockArray.length - 1];
						obj.runNow();
					}
					var pos = d3.transform(d3.select(this).attr("transform")).translate[0];

					var p1, p2;
					var blks = d3.selectAll(".block");
					blks.each(function(d, i) {
							p1 = d3.transform(blks.first().attr("transform")).translate[0];
							p2 = obj.chartWdth - d3.transform(blks.last().attr("transform")).translate[0] - blockWidth;
					});

					if (p1 > 5) {
						obj.scrollBack();
					} else if (p2 > 5) {
						obj.scrollForward();
					}

					console.log("Blocks", p1, pos, p2); //TODO TEMP
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
				})
			.on("dragstart", function() {
					d3.select(this).node().style.cursor = "ew-resize";
				})
			.on("dragend", function() {
					d3.select(this).node().style.cursor = "auto";
			});

		// *** Draw the block chain! ***
		if (grph.select(".blocks").empty()) {
			grph.append("g").attr("class", "blocks");
		}
		var blocks = grph.select(".blocks").selectAll(".block").data(blockArray, function(d) { return d; } );
		var block = blocks.enter()
			.append("g").attr("class", "block")
			.attr("transform", function(d) { return "translate(" + scaleX(d + ((dirn > 1) ? 1 : 0)) + ", " + yPosn + ")"; })
			.call(drag); // The drag handler should be attached to the element being dragged

		block.append("rect").attr("class", "block-rect").style("display", "none")
			.attr("x", 0).attr("y", 0).attr("width", BLOCK_SIDE_LEN).attr("height", BLOCK_SIDE_LEN);
		block.append("polygon").attr("class", "block-rect").style("display", "none")
			.attr("points", poly1);
		block.append("polygon").attr("class", "block-rect").style("display", "none")
			.attr("points", poly2);
		block.append("polygon").attr("class", "block-slct").style("display", "none")
			.attr("points", poly3);
		block.append("line").attr("class", "block-line").style("display", "none")
			.attr("x1", BLOCK_SIDE_LEN + BLOCK_LINE_Y).attr("y1", BLOCK_LINE_Y)
			.attr("x2", blockWidth).attr("y2", BLOCK_LINE_Y);
		block.append("text").attr("class", "block-text").style("display", "none")
			.text(function(d) { return d; })
			.attr("x", BLOCK_SIDE_HLF)
			.attr("y", BLOCK_SIDE_HLF).attr("text-anchor", "middle").attr("dominant-baseline", "middle");

		// Since the <g> element (variable 'block') does not receive mouse event, add this invisible box in between the blocks to allow dragging at these places
		block.append("rect").attr("class", "overlay")
			.attr("x", BLOCK_SIDE_LEN + BLOCK_SIDE_X).attr("y", BLOCK_SIDE_Y)
			.attr("width", blockWidth - BLOCK_SIDE_LEN - BLOCK_SIDE_X).attr("height", BLOCK_SIDE_LEN - BLOCK_SIDE_Y);

		block.append("rect").attr("class", "overlay")
			.attr("x", 0).attr("y", BLOCK_SIDE_Y).attr("width", BLOCK_SIDE_LEN + BLOCK_SIDE_X).attr("height", BLOCK_SIDE_LEN - BLOCK_SIDE_Y)
			.on("mouseover", function(d, i) {
					block.select(".block-slct").style("opacity", "0.5");
				})
			.on("mouseout", function(d, i) {
					if ((obj.displayTo < 0) || (obj.selected != d)) {
						block.select(".block-slct").style("opacity", "0.0");
					}
				})
			.on("click", function(d) {
					grph.selectAll(".block-slct").style("opacity", "0.0"); // Clear any other selections
					obj.selected = d;
					obj.displayTo = blockArray[blockArray.length - 1];
					obj.runNow();
					block.select(".block-slct").style("opacity", "0.5");
					grph.select("#btn-end").style("display", "block");
			});

		blocks.exit().remove(); // Remove graphical elements binded with removed data

		// *** Slide blocks to left ***
		blocks.transition().duration(duration).ease("linear")
			.attr("transform", function(d) { return "translate(" + scaleX(d) + ", " + yPosn + ")"; })
			.call(endAll, function() { callback(); });
		blocks.selectAll(".block-rect, .block-line, .block-text, .block-slct").transition().delay(duration).style("display", "block");
	};

	// *** Util functions ***
	this.addBlock = function(value) {
		blockArray.push((!value) ? blockArray[blockArray.length - 1] + 1 : value);
		if (blockArray.length > (MAX_BLOCK_DSP + 1)) {
			blockArray.shift();
		}
		return blockArray[blockArray.length - 1];
	};

	this.scrollForward = function(blockWidth) {
		var value = blockArray[blockArray.length - 1] + 1;
		if (value < (chainDepth - 1)) {
			blockArray.push(value);
			if (blockArray.length > (MAX_BLOCK_DSP + 1)) {
				blockArray.shift();
			}
			this.redraw(0, function() {}, 1);
		}
	};

	this.scrollBack = function() {
		var value = blockArray[0] - 1;
		if (value >= 0) {
			blockArray.unshift(value);
			if (blockArray.length > (MAX_BLOCK_DSP + 1)) {
				blockArray.pop();
			}
			this.redraw(0, function() {}, -1);
		}
	};

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
