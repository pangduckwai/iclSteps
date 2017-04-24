
var isIE = false;
if ((/*@cc_on ! @*/ false) || navigator.userAgent.match(/Trident/g)) {
	isIE = true;
}

const RUN_INTERVAL = 1000;
const MAX_BLOCK_DSP = 10;
const MARGIN_LEFT = 10;

var threadId = null;

function init() {
	threadId = setInterval(function() {
			render();
	}, RUN_INTERVAL);
}

function stop() {
	clearInterval(threadId);
	threadId = null;
}

function render() {
	// Draw block-list
	var blockList = d3.select("#block-list");
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
	var blockCount = 7; //TODO: get from the chain...
	for (var idx = 0; idx < blockCount; idx ++) {
		blockArray[idx] = idx;
	}
	if (blockArray.length > MAX_BLOCK_DSP) blockArray.length = MAX_BLOCK_DSP; //truncate
	var blocksWidth = (dimen.width / (MAX_BLOCK_DSP-1)) * (blockArray.length-1);
	var scaleX = d3.scale.ordinal().domain(blockArray.map(function(d) {return d;})).range([0, blocksWidth]);

	var tickDistance = MARGIN_LEFT; // Any value
	if (blockArray.length > 1) {
		tickDistance = scaleX(blockArray[1]) - scaleX(blockArray[0]);
	}

	var blocks = grph.selectAll("block").data(blockArray, function(d) { return d; } );
	var block = blocks.enter().append("g").attr("class", "block").attr("transform", "translate(0, " + (dimen.height / 2) + ")");
	block.append("rect").attr("class", "block-rect")
		.attr("x", function(d) { return scaleX(d) + MARGIN_LEFT; })
		.attr("y", 0).attr("width", 20).attr("height", 20);
	block.append("polygon").attr("class", "block-rect")
		.attr("points", function(d) {
				var p0 = [scaleX(d) + MARGIN_LEFT, 0];
				var p1 = [p0[0] + 12, -8];
				var p2 = [p1[0] + 20, -8];
				var p3 = [p0[0] + 20,  0];
				return [p0.join(","), p1.join(","), p2.join(","), p3.join(",")].join(" ");
		});
	block.append("polygon").attr("class", "block-rect")
		.attr("points", function(d) {
				var p0 = [scaleX(d) + MARGIN_LEFT + 20,  0];
				var p1 = [p0[0] + 12, -8];
				var p2 = [p1[0], 12];
				var p3 = [p0[0], 20];
				return [p0.join(","), p1.join(","), p2.join(","), p3.join(",")].join(" ");
		});
	block.append("line").attr("class", "block-line")
		.attr("x1", function(d) { return scaleX(d) + MARGIN_LEFT - tickDistance + 26; }).attr("y1", 6)
		.attr("x2", function(d) { return scaleX(d) + MARGIN_LEFT; }).attr("y2", 6);
	block.append("line").attr("class", "block-line")
		.attr("x1", function(d) { return scaleX(d) + MARGIN_LEFT + 26; }).attr("y1", 6)
		.attr("x2", function(d) { return scaleX(d) + MARGIN_LEFT + tickDistance; }).attr("y2", 6);
	block.append("text").attr("class", "block-text")
		.text(function(d) { return d; })
		.attr("x", function(d) { return scaleX(d) + MARGIN_LEFT + 10; })
		.attr("y", 10).attr("text-anchor", "middle").attr("dominant-baseline", "middle");

	blocks.exit().remove();
}