
const MAX_BLOCK_DSP = 10;

const BLOCK_SIDE_LEN = 40;
const BLOCK_SIDE_HLF = BLOCK_SIDE_LEN / 2;
const BLOCK_SIDE_X = 0.6 * BLOCK_SIDE_LEN;
const BLOCK_SIDE_Y = -0.4 * BLOCK_SIDE_LEN;
const BLOCK_LINE_Y = 0.3 * BLOCK_SIDE_LEN;

BlockIllustrator = function(chartId) {
	this.id = "block-illust"; //Chart ID
	this.domId = (!chartId) ? this.id : chartId; //Element ID in DOM
	this.name = "Blockchain illustrator";
	this.url = "%%%urlChain%%%";
	this.minGridWdth = 5;
	this.minGridHght = 2;
	this.updateInterval = 2000;

	this.selected = -1; // Meaning always select the latest block
	this.displayTo = 0;

	var timeFormat = d3.time.format("%H:%M:%S");
	var paddTop = 15, paddLft = 45, paddRgt = 10, paddBtm = 70, txtHght = 15;

	this.buildUi = function(func) {
		func('<div class="chart-title"></div><svg class="chart-viz" />');
	};

	var duration = 0;
	this.render = function() {
		var obj = this;
//		accessData(this.url, function(rspn) {
		accessDummy(this.url, function(rspn) {
				obj.redraw(duration, rspn);
		});
		duration = 2000;
	};

	this.redraw = function(duration, rspn) {
		if (!rspn || (rspn.length <= 0)) {
			return;
		}
		var blockArray = [];
		var domainArray = [];
		var valTo = (this.selected < 0) ? rspn.height : this.displayTo;
		var valFm = valTo - MAX_BLOCK_DSP - 2;
		if (valFm < 0) valFm = 0;
		var idx = 0;
		while (valFm < valTo) {
			domainArray[idx] = valFm;
			blockArray[idx ++] = valFm ++;
		}
		if (idx < (MAX_BLOCK_DSP + 2)) {
			while (idx < (MAX_BLOCK_DSP + 1)) {
				domainArray[idx ++] = valFm ++;
			}
			domainArray.splice(0, 0, -1);
		}

		var grph = d3.select("#"+this.domId).select(".chart-viz");

		var blockWidth = this.chartWdth / MAX_BLOCK_DSP;

		var scaleX = d3.scale.ordinal().domain(domainArray).rangeRoundBands([-1 * blockWidth, this.chartWdth + blockWidth + 20]);
		var tickLastPosn = scaleX(blockArray[blockArray.length - 1]);
		var tickDistance = scaleX.rangeBand();

		var yPosn = this.chartHght / 2;

		var poly1 =
			 [[0, 0].join(",")
			, [BLOCK_SIDE_X, BLOCK_SIDE_Y].join(",")
			, [BLOCK_SIDE_X + BLOCK_SIDE_LEN, BLOCK_SIDE_Y].join(",")
			, [BLOCK_SIDE_LEN,  0].join(",")].join(" ");

		var poly2 =
			 [[BLOCK_SIDE_LEN,  0].join(",")
			, [BLOCK_SIDE_LEN + BLOCK_SIDE_X, BLOCK_SIDE_Y].join(",")
			, [BLOCK_SIDE_LEN + BLOCK_SIDE_X, BLOCK_SIDE_X].join(",")
			, [BLOCK_SIDE_LEN, BLOCK_SIDE_LEN].join(",")].join(" ");

		var blocks = grph.selectAll(".block").data(blockArray, function(d) { return d; } );
		var block = blocks.enter()
			.append("g").attr("class", "block")
			.attr("transform", "translate(" + tickLastPosn + ", " + yPosn + ")");

		block.append("rect").attr("class", "block-rect")
			.attr("x", 0).attr("y", 0).attr("width", BLOCK_SIDE_LEN).attr("height", BLOCK_SIDE_LEN);
		block.append("polygon").attr("class", "block-rect")
			.attr("points", poly1);
		block.append("polygon").attr("class", "block-rect")
			.attr("points", poly2);
		block.append("line").attr("class", "block-line")
			.attr("x1", BLOCK_SIDE_LEN + BLOCK_LINE_Y).attr("y1", BLOCK_LINE_Y)
			.attr("x2", tickDistance).attr("y2", BLOCK_LINE_Y);
		block.append("text").attr("class", "block-text")
			.text(function(d) { return d; })
			.attr("x", BLOCK_SIDE_HLF)
			.attr("y", BLOCK_SIDE_HLF).attr("text-anchor", "middle").attr("dominant-baseline", "middle");

		blocks.exit().remove();

		blocks.transition().duration(duration).ease("linear")
			.attr("transform", function(d) { return "translate(" + scaleX(d) + ", " + yPosn + ")"; });
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

var dummy = 7;
function accessDummy(url, callback) {
	//var sec = Math.floor(Math.random() * 10) + 5; //random 5 to 15
	//setTimeout(function() {
	dummy ++;
	callback({ "height" : dummy, "currentBlockHash" : ("RrndKwuojRMjOz/rdD7rJD/NUupiuBuCtQwnZG7Vdi/XXcTd2MDyAMsFAZ1ntZL2/IIcSUeatIZAKS6ss7fEvg" + dummy)});
	//}, 1000 * (Math.floor(Math.random() * 10) + 5));
}
