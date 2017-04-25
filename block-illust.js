
const MAX_BLOCK_DSP = 10;
const MARGIN_LEFT = 15;
const BLOCK_SIDE_LEN = 40;

BlockIllustrator = function(chartId) {
	this.id = "block-illust"; //Chart ID
	this.domId = (!chartId) ? this.id : chartId; //Element ID in DOM
	this.name = "Blockchain illustrator";
	this.url = "%%%urlChain%%%";
	this.minGridWdth = 4;
	this.minGridHght = 4;
	this.updateInterval = 1000;

	this.selected = -1; // Meaning always select the latest block

	var timeFormat = d3.time.format("%H:%M:%S");
	var paddTop = 15, paddLft = 45, paddRgt = 10, paddBtm = 70, txtHght = 15;
	var durationX = 2000, durationY = 1000;

	this.buildUi = function(func) {
		func('<div class="chart-title"></div><svg class="chart-viz" />');
	};

	this.init = function() {
		d3.select("#"+this.domId).select(".chart-title").html("Blockchain illustrator");
	};

	this.render = function() {
		var obj = this;
		accessData(this.url, function(rspn) {
			if (!rspn || (rspn.length <= 0)) {
				return;
			}
			console.log(rspn);
		});
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



function render() {
	var uldim = d3.select(".charts").node().getBoundingClientRect();

	// Draw block-list
	var blockList = d3.select("#block-list");
	blockList.style("top", uldim.y + 5).style("left", 5);
	var dimen = blockList.node().getBoundingClientRect();

	var grph = blockList.select(".chart-ctnt .chart-viz");
	if (grph.empty()) {
		grph = blockList.append("div").attr("class", "chart-ctnt").append("svg").attr("class", "chart-viz");
	}
	grph.attr("viewBox", "0 0 " + dimen.width + " " + dimen.height).attr("preserveAspectRation", "none");
	if (isIE) {
		blockList.select(".chart-ctnt").style("height", dimen.height + "px");
	}

	var blockArray = [];
	var blockCount = 10; //TODO: get from the chain...
	for (var idx = 0; idx < blockCount; idx ++) {
		blockArray[idx] = idx;
	}
	if (blockArray.length > MAX_BLOCK_DSP) blockArray.length = MAX_BLOCK_DSP; //TODO: truncate
	var blocksWidth = ((dimen.width - MARGIN_LEFT) / MAX_BLOCK_DSP) * blockArray.length;
	var scaleX = d3.scale.ordinal().domain(blockArray).rangeRoundPoints([0, blocksWidth]);

	var tickDistance = MARGIN_LEFT; // Any value
	if (blockArray.length > 1) {
		tickDistance = scaleX(blockArray[blockArray.length - 1]) - scaleX(blockArray[blockArray.length - 2]);
	}
	console.log(new Date(), dimen.width, blocksWidth, tickDistance); //TODO TEMP

	var BLOCK_SIDE_HLF = BLOCK_SIDE_LEN / 2;
	var BLOCK_SIDE_X = 0.6 * BLOCK_SIDE_LEN;
	var BLOCK_SIDE_Y = -0.4 * BLOCK_SIDE_LEN;
	var BLOCK_LINE_Y = 0.3 * BLOCK_SIDE_LEN;

	var blocks = grph.selectAll("block").data(blockArray, function(d) { return d; } );
	var block = blocks.enter().append("g").attr("class", "block").attr("transform", "translate(0, " + (dimen.height / 2) + ")");
	block.append("rect").attr("class", "block-rect")
		.attr("x", function(d) { return scaleX(d) + MARGIN_LEFT; })
		.attr("y", 0).attr("width", BLOCK_SIDE_LEN).attr("height", BLOCK_SIDE_LEN);
	block.append("polygon").attr("class", "block-rect")
		.attr("points", function(d) {
				var p0 = [scaleX(d) + MARGIN_LEFT, 0];
				var p1 = [p0[0] + BLOCK_SIDE_X, BLOCK_SIDE_Y];
				var p2 = [p1[0] + BLOCK_SIDE_LEN, BLOCK_SIDE_Y];
				var p3 = [p0[0] + BLOCK_SIDE_LEN,  0];
				return [p0.join(","), p1.join(","), p2.join(","), p3.join(",")].join(" ");
		});
	block.append("polygon").attr("class", "block-rect")
		.attr("points", function(d) {
				var p0 = [scaleX(d) + MARGIN_LEFT + BLOCK_SIDE_LEN,  0];
				var p1 = [p0[0] + BLOCK_SIDE_X, BLOCK_SIDE_Y];
				var p2 = [p1[0], BLOCK_SIDE_X];
				var p3 = [p0[0], BLOCK_SIDE_LEN];
				return [p0.join(","), p1.join(","), p2.join(","), p3.join(",")].join(" ");
		});
	block.append("line").attr("class", "block-line")
		.attr("x1", function(d) { return scaleX(d) + MARGIN_LEFT - tickDistance + BLOCK_SIDE_LEN + BLOCK_LINE_Y; }).attr("y1", BLOCK_LINE_Y)
		.attr("x2", function(d) { return scaleX(d) + MARGIN_LEFT; }).attr("y2", BLOCK_LINE_Y);
	block.append("line").attr("class", "block-line")
		.attr("x1", function(d) { return scaleX(d) + MARGIN_LEFT + BLOCK_SIDE_LEN + BLOCK_LINE_Y; }).attr("y1", BLOCK_LINE_Y)
		.attr("x2", function(d) { return scaleX(d) + MARGIN_LEFT + tickDistance; }).attr("y2", BLOCK_LINE_Y);
	block.append("text").attr("class", "block-text")
		.text(function(d) { return d; })
		.attr("x", function(d) { return scaleX(d) + MARGIN_LEFT + BLOCK_SIDE_HLF; })
		.attr("y", BLOCK_SIDE_HLF).attr("text-anchor", "middle").attr("dominant-baseline", "middle");

	blocks.exit().remove();
}