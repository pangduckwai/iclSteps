
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

	this.selected = -1; // Meaning always select the latest block
	this.displayTo = 0;

	this.buildUi = function(func) {
		func('<div class="chart-title"></div><svg class="chart-viz" />');
	};

	var blockArray = [0];
	var catchUp = false;
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

				if (obj.selected < 0) {
					var lastVal = blockArray[blockArray.length - 1];
					var nextVal = rspn.height - 1;
					var itr = nextVal - lastVal;

					if (itr > 1) {
						var idx = 0;

						function _redraw() {
							if (idx < itr) {
								var dur = 20;
								if (idx == (itr - 1)) {
									catchUp = false;
									dur = 1000;
								} else {
									catchUp = true;
									if (idx == (itr - 2))
										dur = 500;
									else if (idx == (itr - 3))
										dur = 250;
									else if (idx == (itr - 4))
										dur = 125;
									else if (idx == 0)
										dur = 100;
								}

								idx ++;
								blockArray[blockArray.length] = ++ lastVal;
								if (blockArray.length > (MAX_BLOCK_DSP + 2)) {
									blockArray.shift();
								}
//								console.log("Catching up", JSON.stringify(blockArray)); //TODO TEMP
								obj.redraw(dur, rspn, _redraw);
							} else {
								catchUp = false;
							}
						}
						_redraw();
					} else if (itr == 1) {
						blockArray[blockArray.length] = nextVal;
						if (blockArray.length > (MAX_BLOCK_DSP + 2)) {
							blockArray.shift();
						}
						obj.redraw(2000, rspn, function() {} );
					}
				} else {
					obj.redraw(2000, rspn, function() {} );
				}
				//console.log(blockArray); //TODO TEMP
		});
	};

	this.redraw = function(duration, rspn, callback) {
		var obj = this;
		var grph = d3.select("#"+this.domId).select(".chart-viz");

		var blockWidth = this.chartWdth / MAX_BLOCK_DSP;

		var scaleX = d3.scale.linear()
			.domain((blockArray.length < (MAX_BLOCK_DSP + 2)) ? [0, 10] : [blockArray[1], blockArray[MAX_BLOCK_DSP + 1]])
			.range([0, this.chartWdth + 5]);

		var yPosn = this.chartHght / 4;

		// Draw the resume button
		if (grph.select("#btn-end").empty()) {
			grph.append("image").attr("id", "btn-end").attr("x", this.chartWdth - 40).attr("y", 4).attr("xlink:href", IMG_TOEND).style("display", "none")
				.on("click", function() {
						obj.selected = -1;
						obj.displayTo = 0;
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

		// Draw chain height
		if (grph.select("#txt-hght").empty()) {
			grph.append("text").attr("id", "txt-hght").attr("class", "block-text")
			.attr("x", 10).attr("y", 20).attr("text-anchor", "left");
		}
		grph.select("#txt-hght").text("Current chain depth: " + rspn.height);

		// Draw the block chain!
		var blocks = grph.selectAll(".block").data(blockArray, function(d) { return d; } );
		var block = blocks.enter()
			.append("g").attr("class", "block")
			.attr("transform", function(d) { return "translate(" + scaleX(d) + ", " + yPosn + ")"; });

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

		block.append("rect").attr("class", "overlay")
			.attr("x", 0).attr("y", BLOCK_SIDE_Y).attr("width", BLOCK_SIDE_LEN + BLOCK_SIDE_X).attr("height", BLOCK_SIDE_LEN - BLOCK_SIDE_Y)
			.on("mouseover", function(d, i) {
					block.select(".block-slct").style("display", "block");
				})
			.on("mouseout", function(d, i) {
					if ((obj.selected < 0) || (obj.selected != d)) {
						block.select(".block-slct").style("display", "none");
					}
				})
			.on("click", function(d) {
					grph.selectAll(".block-slct").style("display", "none");
					obj.selected = d;
					obj.displayTo = blockArray[blockArray.length - 1];
					block.select(".block-slct").style("display", "block");
					grph.select("#btn-end").style("display", "block");
			});

		blocks.exit().remove();

		blocks.transition().duration(duration).ease("linear")
			.attr("transform", function(d) { return "translate(" + scaleX(d) + ", " + yPosn + ")"; })
			.call(endAll, function() { callback(); });
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

function endAll(trans, func) {
	var n = 0;
	trans
		.each(function() { ++n; })
		.each("end", function() { if (!--n) func.apply(this, arguments); });
};

var dummy = 8;
setInterval(function() {
		dummy ++;
}, 2000);

function accessDummy(url, callback) {
	callback({ "height" : dummy, "currentBlockHash" : ("RrndKwuojRMjOz/rdD7rJD/NUupiuBuCtQwnZG7Vdi/XXcTd2MDyAMsFAZ1ntZL2/IIcSUeatIZAKS6ss7fEvg" + dummy)});
}
