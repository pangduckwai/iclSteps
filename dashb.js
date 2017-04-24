
var isIE = false;
if ((/*@cc_on ! @*/ false) || navigator.userAgent.match(/Trident/g)) {
	isIE = true;
}

const RUN_INTERVAL = 3000;
const MAX_BLOCK_DSP = 10;
const MARGIN_LEFT = 15;
const BLOCK_SIDE_LEN = 40;

var threadId = null;

function init() {
	/*threadId = setInterval(function() {
			render();
	}, RUN_INTERVAL);*/
	render();
}

function stop() {
	clearInterval(threadId);
	threadId = null;
}

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