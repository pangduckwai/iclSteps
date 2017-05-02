
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

BlockIllustrator = function(chartId) {
	this.id = "block-illust"; //Chart ID
	this.domId = (!chartId) ? this.id : chartId; //Element ID in DOM
	this.name = "Blockchain illustrator";
	this.url = "%%%urlChain%%%";
	this.minGridWdth = 5;
	this.minGridHght = 3;
	this.updateInterval = 2000;

	this.selected = -1;
	this.displayTo = -1; // Meaning always select the latest block

	var chainDepth = 0;
	var blockArray = [0];
	var blockPos1st = -100;
	var blockPosLst = -100;
	var catchUp = false;

	// *** Called by dashboard main thread
	this.render = function() {
		if (catchUp) {
			console.log("Catching up, normal run interrupted"); //TODO TEMP
			return;
		}

		var obj = this;
//		accessData(this.url, function(rspn) {
		accessDummy(this.url, function(rspn) {
				if (!rspn || (rspn.length <= 0)) {
					return;
				}
				chainDepth = rspn.height;

				if (obj.displayTo < 0) {
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
								obj.redraw(dur, false, _redraw); // Catching up
							} else {
								catchUp = false;
							}
						}
						_redraw();
					} else if (itr == 1) {
						obj.addBlock(nextVal);
						obj.redraw(2000, false, function() {} ); // Normal ticking
					}
				} else {
					obj.redraw(2000, true, function() {} ); // Interactive mode, only update latest chain depth
				}
				//console.log(blockArray); //TODO TEMP
		});
	};

	// *** Util functions ***
	this.addBlock = function(value) {
		blockArray.push((!value) ? blockArray[blockArray.length - 1] + 1 : value);
		if (blockArray.length > (MAX_BLOCK_DSP + 2)) {
			blockArray.shift();
		}
		return blockArray[blockArray.length - 1];
	};

	this.scrollForward = function() {
		var value = blockArray[blockArray.length - 1] + 1;
		if (value < (chainDepth - 1)) {
			blockArray.push(value);
			if (blockArray.length > (MAX_BLOCK_DSP + 2)) {
				blockArray.shift();
			}
			//this.redraw(0, false, function() {} ); TODO HERE
			return true;
		} else {
			return false;
		}
	};

	this.scrollBack = function() {
		var value = blockArray[0] - 1;
		if (value >= 0) {
			blockArray.unshift(value);
			if (blockArray.length > (MAX_BLOCK_DSP + 2)) {
				blockArray.pop();
			}
			//this.redraw(0, false, function() {} ); TODO HERE
			return true;
		} else {
			return false;
		}
	};

	this.redraw = function(duration, textOnly, callback) {
		var obj = this;
		var grph = d3.select("#"+this.domId).select(".chart-viz");

		var blockWidth = this.chartWdth / MAX_BLOCK_DSP;

		var scaleX = d3.scale.linear()
			.domain((blockArray.length < (MAX_BLOCK_DSP + 2)) ? [0, 10] : [blockArray[1], blockArray[MAX_BLOCK_DSP + 1]])
			.range([0, this.chartWdth + 2]);

		var yPosn = this.chartHght / 4;
		console.log(JSON.stringify(blockArray)); //TODO TEMP

		// *** Draw chain height text ***
		if (grph.select("#txt-hght").empty()) {
			grph.append("text").attr("id", "txt-hght").attr("class", "block-text")
			.attr("x", 10).attr("y", 20).attr("text-anchor", "left");
		}
		grph.select("#txt-hght").text("Current chain depth: " + chainDepth);
		if (textOnly) return;

		// *** Drag handler ***
		var drag = d3.behavior.drag()
			.on("drag", function(dat) {
					if (obj.displayTo < 0) {
						grph.select("#btn-end").style("display", "block");
						obj.displayTo = blockArray[blockArray.length - 1];
						obj.runNow();
					}
					var pos = d3.transform(d3.select(this).attr("transform")).translate[0];

					d3.selectAll(".block")
						.attr("transform", function(d, i) {
								var p = d3.transform(d3.select(this).attr("transform")).translate[0];

								if (i == 0) { // Do only once for all the selections
									blockPos1st = p;
									blockPosLst = obj.chartWdth - pos - (obj.displayTo - dat + 1) * blockWidth;

									if (blockPos1st >= 10) {
										if (obj.scrollBack()) blockPos1st -= (blockWidth + 10);
									} else if (blockPosLst >= 10) {
										if (obj.scrollForward()) blockPosLst -= (blockWidth + 10);
									}
								}

								if (blockPos1st >= 10) {
									return "translate(" + (p - 10) + ", " + yPosn + ")";
								} else if (blockPosLst >= 10) {
									return "translate(" + (p + 10) + ", " + yPosn + ")";
								} else {
									return "translate(" + (p + d3.event.dx) + ", " + yPosn + ")";
								}
						})
				})
			.on("dragstart", function() {
					d3.select(this).node().style.cursor = "ew-resize";
				})
			.on("dragend", function() {
					d3.select(this).node().style.cursor = "auto";
			});

		// *** Draw the block chain! ***
		var blocks = grph.selectAll(".block").data(blockArray, function(d) { return d; } );
		var block = blocks.enter()
			.append("g").attr("class", "block")
			.attr("transform", function(d) { return "translate(" + scaleX(d) + ", " + yPosn + ")"; })
			.call(drag); // The drag handler should be attached to the element being dragged

		block.append("rect").attr("class", "block-rect")
			.attr("x", 0).attr("y", 0).attr("width", BLOCK_SIDE_LEN).attr("height", BLOCK_SIDE_LEN);
		block.append("polygon").attr("class", "block-rect")
			.attr("points", poly1);
		block.append("polygon").attr("class", "block-rect")
			.attr("points", poly2);
		block.append("polygon").attr("class", "block-slct")
			.attr("points", poly3);
		block.append("line").attr("class", "block-line")
			.attr("x1", BLOCK_SIDE_LEN + BLOCK_LINE_Y).attr("y1", BLOCK_LINE_Y)
			.attr("x2", blockWidth).attr("y2", BLOCK_LINE_Y);
		block.append("text").attr("class", "block-text")
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
					block.select(".block-slct").style("display", "block");
				})
			.on("mouseout", function(d, i) {
					if ((obj.displayTo < 0) || (obj.selected != d)) {
						block.select(".block-slct").style("display", "none");
					}
				})
			.on("click", function(d) {
					grph.selectAll(".block-slct").style("display", "none"); // Clear any other selections
					obj.selected = d;
					obj.displayTo = blockArray[blockArray.length - 1];
					obj.runNow();
					block.select(".block-slct").style("display", "block");
					grph.select("#btn-end").style("display", "block");
			});

		blocks.exit().remove(); // Remove graphical elements binded with removed data

		// *** Slide blocks to left ***
		blocks.transition().duration(duration).ease("linear")
			.attr("transform", function(d) { return "translate(" + scaleX(d) + ", " + yPosn + ")"; })
			.call(endAll, function() { callback(); });

		// *** Draw the resume button ***
		if (grph.select("#btn-end").empty()) {
			grph.append("image").attr("id", "btn-end").attr("x", this.chartWdth - 40).attr("y", 4).attr("width", 18).attr("height", 18)
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

// ***** TEMP *****
var dummy = 8;
setInterval(function() {
		if (dummy < 35) dummy ++;
}, 2000);
function accessDummy(url, callback) {
	callback({ "height" : dummy, "currentBlockHash" : ("RrndKwuojRMjOz/rdD7rJD/NUupiuBuCtQwnZG7Vdi/XXcTd2MDyAMsFAZ1ntZL2/IIcSUeatIZAKS6ss7fEvg" + dummy)});
}
