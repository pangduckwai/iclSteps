BlockIllustrator = function(chartId) {
	Chart.call(this);

	this.id = "illust-block"; //Chart ID
	this.domId = (!chartId) ? this.id : chartId; //Element ID in DOM
	this.name = "Blockchain illustrator";
	this.minGridWdth = 6;
	this.minGridHght = 2;
	this.updateInterval = 2000;
	this.maxBlockDisplay = 10; // Maximum number of blocks to display at one time
	this.blockSideLength = 40; // Size of the blocks drawn
	this.selected = -1;
	this.interactiveMode = false; // Default is scorll forward as new blocks arrive

	var urlBlock = "http://%%%nodeServer%%%:8080/ws/temp3/"; //"%%%urlBlock%%%";

	var blockWidth;
	var yPosn;
	var scaleX;

	var chainDepth = 0;
	var blockArray = [];
	var catchUp = false;

	var _this = this;
	var grph;
	var line;

	var blockHalf;
	var blockPls5, blockPlsX, blockPlsY, blockMnsY;
	var blockSideX;
	var blockSideY, blockSideY2;
	var blockLineY, blockLineY2, blockLineY3;
	var blockOffset;
	var shape1;
	var shape2;
	var shape3;

	// *** Called by dashboard main thread once at the begining ***
	this.start = function() {
		blockWidth = this.chartWdth / this.maxBlockDisplay;
		yPosn = this.chartHght / 3;
		grph = d3.select("#"+this.domId).select(".chart-viz");
		line = d3.svg.line();

		blockSideX = this.blockSideLength * 0.6;
		blockSideY = this.blockSideLength * -0.4;
		blockLineY = this.blockSideLength * 0.3;
		blockSideY2 = blockSideY + 5;
		blockLineY2 = blockLineY + 5;
		blockLineY3 = blockLineY + 10;
		blockHalf = this.blockSideLength / 2;
		blockPls5 = this.blockSideLength + 5;
		blockPlsX = this.blockSideLength + blockSideX;
		blockPlsY = this.blockSideLength + blockLineY - blockWidth;
		blockMnsY = this.blockSideLength - blockSideY;
		blockOffset = blockWidth - blockPlsX - 5;

		scaleX = d3.scale.linear().range([blockOffset, this.chartWdth - blockWidth + blockOffset]);

		shape1 = [[0, 0].join(",")
				, [blockSideX, blockSideY].join(",")
				, [blockPlsX, blockSideY2].join(",")
				, [blockPlsX, blockSideX + 5].join(",")
				, [this.blockSideLength, blockPls5].join(",")
				, [0, this.blockSideLength].join(",")].join(" ");
		shape2 = [[0, 0].join(",")
				, [this.blockSideLength, 5].join(",")
				, [blockPlsX, blockSideY2].join(",")].join(" ");
		shape3 = [[blockPlsY + 5, blockLineY3].join(",")
				, [blockPlsY, blockLineY2].join(",")
				, [blockPlsY + 5, blockLineY].join(",")].join(" "); 
	};

	// *** Called by dashboard main thread repeatedly ***
	this.render = function(rspn, elapse) {
		if (!this.shouldRun(elapse)) return;

		if (catchUp) {
			//console.log("Catching up, normal run interrupted"); //TODO TEMP
			return;
		}

		if (!rspn || !rspn.blocks) {
			return;
		}
		chainDepth = rspn.blocks.height;

		// *** Draw the resume button ***
		if (grph.select("#btn-end").empty()) {
			grph.append("image").attr("id", "btn-end").attr("x", _this.chartWdth - 40).attr("y", 4).attr("width", 18).attr("height", 18).attr("xlink:href", IMG_PAUSE_S)
				.on("click", function() {
						if (!grph.select(".details").empty()) grph.selectAll(".details").remove();
						if (_this.interactiveMode) {
							_this.interactiveMode = false;
							_this.selected = -1;
							_this.runNow();
							grph.selectAll(".block-slct").style("opacity", "0.0");
							grph.select("#btn-end").attr("xlink:href", IMG_PAUSE_S);
						} else {
							_this.interactiveMode = true;
							_this.selected = -1;
							_this.runNow();
							grph.selectAll(".block-slct").style("opacity", "0.0");
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

		// *** Draw chain height text ***
		if (grph.select("#txt-hght").empty()) {
			grph.append("text").attr("id", "txt-hght").attr("class", "block-text")
				.attr("x", 10).attr("y", 20).attr("text-anchor", "left").style("font-size", "1em");
		}

		// *** Selected ***
		if (_this.selected >= 0) {
			grph.select("#txt-hght").text("Current chain depth: " + chainDepth);
			accessBlock(urlBlock + _this.selected, function(rspnBlock) {
					//console.log(JSON.stringify(rspnBlock));//TODO TEMP
					if (!grph.select(".dtls-text").empty()) grph.selectAll(".dtls-text").remove();

					var time = new Date(0);
					time.setUTCSeconds(rspnBlock.nonHashData.localLedgerCommitTimestamp.seconds);

					var blk = grph.append("text").attr("class", "dtls-text")
						.attr("x", 10).attr("y", _this.chartHght - 80).attr("text-anchor", "left")
						.text("Block " + _this.selected + " selected.");

					grph.append("text").attr("class", "dtls-text")
						.attr("x", 15 + blk.node().getBBox().width).attr("y", _this.chartHght - 80).attr("text-anchor", "left")
						.text("Added on " + timeFormatSrver(time));
					if (rspnBlock.previousBlockHash) {
						grph.append("text").attr("class", "dtls-text")
							.attr("x", 10).attr("y", _this.chartHght - 60).attr("text-anchor", "left")
							.style("font-family", "monospace").style("font-size", "1em")
							.text(rspnBlock.previousBlockHash);
					}
			});
		} else {
			accessBlock(urlBlock + (chainDepth-1), function(rspnBlock) {
					var time = new Date(0);
					time.setUTCSeconds(rspnBlock.nonHashData.localLedgerCommitTimestamp.seconds);
					var posx = _this.chartWdth / 2;
					var posy = _this.chartHght - 60;

					var blk = grph.append("text").attr("class", "dtls-text")
						.text("Latest block: " + (chainDepth-1) + ".")
						.node().getBBox().width;
					grph.select("#txt-hght").transition().delay(_this.updateInterval)
						.text("Current chain depth: " + chainDepth)
						.each("end", function() {
								grph.selectAll(".dtls-text").remove();

								if (_this.selected < 0) {
									if (rspnBlock.previousBlockHash) {
										var hsh = grph.append("text").attr("class", "dtls-text")
											.attr("x", posx).attr("y", posy).attr("text-anchor", "left")
											.style("font-family", "monospace").style("font-size", "1em")
											.text(rspnBlock.previousBlockHash);
										posx = _this.chartWdth - hsh.node().getBBox().width - 35;
										hsh.attr("x", posx);
									}

									grph.append("text").attr("class", "dtls-text")
										.attr("x", posx).attr("y", posy).attr("dy", "-20")
										.attr("text-anchor", "left")
										.text("Latest block: " + (chainDepth-1) + ".");

									grph.append("text").attr("class", "dtls-text")
										.attr("x", posx).attr("y", posy)
										.attr("dx", 5 + blk).attr("dy", "-20")
										.attr("text-anchor", "left")
										.text("Added on " + timeFormatSrver(time));
								}
						});
			});
		}

		// *** Draw the ticking chain ***
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
						_this.redraw(dur, _redraw, 0); // Catching up
					} else {
						catchUp = false;
					}
				}
				_redraw();
			} else if (itr == 1) {
				_this.addBlock(nextVal);
				_this.redraw(_this.updateInterval, function() {}, 0); // Normal ticking
			}
		}
	};

	this.redraw = function(duration, callback, dirn) {
		if (blockArray.length <= this.maxBlockDisplay) {
			scaleX.domain([0, this.maxBlockDisplay - 1]);
			//duration = 0;
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

		block.attr("transform", function(d, i) { return "translate(" + scaleX(i) + ", -1500)"; }).call(drag); // call 'drag' here because the drag handler should be attached to the element being dragged
		block.append("polygon").attr("class", "block-rect")
			.attr("points", shape1).attr("shape-rendering", "geometricPrecision");
		block.append("polyline").attr("class", "block-rect")
			.attr("points", shape2).attr("shape-rendering", "geometricPrecision");
		block.append("line").attr("class", "block-rect")
			.attr("x1", this.blockSideLength).attr("y1", 5)
			.attr("x2", this.blockSideLength).attr("y2", blockPls5);
		block.append("polygon").attr("class", "block-slct")
			.attr("points", shape1).style("opacity", "0.8");
		block.append("line").attr("class", "block-line arrow")
			.attr("x1", blockPlsY).attr("y1", blockLineY2)
			.attr("x2", 0).attr("y2", blockLineY3).style("display", "none");
		block.append("polyline").attr("class", "block-rect arrow")
			.attr("points", shape3).style("display", "none");
		block.append("text").attr("class", "block-text")
			.text(function(d) { return d; })
			.attr("x", blockHalf)
			.attr("y", blockHalf + 2).attr("text-anchor", "middle").attr("dominant-baseline", "middle")
			.attr("transform", "skewY(7)");

		// Since the <g> element (variable 'block') does not receive mouse event, add this invisible box in between the blocks to allow dragging at these places
		block.append("rect").attr("class", "overlay")
			.attr("x", blockPlsX - blockWidth).attr("y", blockSideY)
			.attr("width", blockWidth - blockPlsX).attr("height", blockMnsY + 5);

		block.append("rect").attr("class", "overlay")
			.attr("x", 0).attr("y", blockSideY).attr("width", blockPlsX).attr("height", blockMnsY + 5)
			.on("mouseover", function(d, i) {
					block.select(".block-slct").style("opacity", "0.8");
				})
			.on("mouseout", function(d, i) {
					if ((!_this.interactiveMode) || (_this.selected != d)) {
						block.select(".block-slct").style("opacity", "0.0");
					}
				})
			.on("click", function(d) {
					if (!grph.select(".details").empty()) grph.selectAll(".details").remove();
					grph.selectAll(".block-slct").style("opacity", "0.0"); // Clear any other selections
					grph.select("#btn-end").attr("xlink:href", IMG_PLAY_S);
					_this.interactiveMode = true;
					_this.selected = d;
					_this.runNow();
					block.select(".block-slct").style("opacity", "0.8");
			});

		blocks.exit().remove(); // Remove graphical elements binded with removed data

		blocks.transition().duration(duration).ease("linear")
			.attr("transform", function(d, i) { return "translate(" + scaleX(i) + ", " + yPosn + ")"; })
			.call(endAll, function() { callback(); });

		blocks.selectAll(".block-slct").transition().delay(duration).style("opacity", "0.0");
		blocks.selectAll(".arrow").transition().delay(duration).style("display", "block");
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
						p1 = d3.transform(blks.first().attr("transform")).translate[0] - blockOffset;
						p2 = _this.chartWdth - d3.transform(blks.last().attr("transform")).translate[0] - blockWidth + blockOffset;
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

	var superFromCookie = this.fromCookie;
	this.fromCookie = function(cook) {
		superFromCookie.call(this, cook);
		if (cook) {
			this.selected = parseInt(cook["selected"]);
		}
	};

	var superToCookie = this.toCookie;
	this.toCookie = function(row, col, wdth, hght, intv) {
		var cook = superToCookie.call(this, row, col, wdth, hght, intv);
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

function accessBlock(url, func) {
	accessData(url, function(rspn) {
			if (!rspn || (rspn.length <= 0)) {
				return;
			} else {
				func(rspn);
			}
	});
};