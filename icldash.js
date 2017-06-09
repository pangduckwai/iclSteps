// **** Constants ****
const COK_PFX = "dashcook=";
const KEY_CHART = "chartId";
const KEY_ROW = "row";
const KEY_COL = "column";
const KEY_WDTH = "width"
const KEY_HGHT = "height";

const DRAG_CHART_ENABLED = false;

// **** Configurables ****
const RUN_INTERVAL = 250; //2500 is 2.5 seconds
const MAX_ROW = 5; // Number of rows available in the dashboard grid
const MAX_COL = 8; // Number of columns available in the dashboard grid

// **** Themes ****
const THEME_IS_DARK = true; // false means theme lis 'light'
const IMG_PLAY = "icon_play" + (THEME_IS_DARK ? 'w' : 'b') + ".png";
const IMG_PLAY_S = "icon_play1" + (THEME_IS_DARK ? 'w' : 'b') + ".png";
const IMG_PAUSE = "icon_pause" + (THEME_IS_DARK ? 'w' : 'b') + ".png";
const IMG_PAUSE_S = "icon_pause1" + (THEME_IS_DARK ? 'w' : 'b') + ".png";
const IMG_CONFIG = "icon_more" + (THEME_IS_DARK ? 'w' : 'b') + ".png";
const IMG_SETTING = "icon_more1" + (THEME_IS_DARK ? 'w' : 'b') + ".png";
const IMG_NETWORK = "icon_net1" + (THEME_IS_DARK ? 'w' : 'b') + ".png";
const IMG_REFRESH = "icon_refresh" + (THEME_IS_DARK ? 'w' : 'b') + ".png";
const IMG_TOEND = "icon_end1" + (THEME_IS_DARK ? 'w' : 'b') + ".png";

const topMargin = 72;
const btmMargin = 18;
const lftMargin = 20;
const rgtMargin = 20;
const cellGap = 5;

const regex = new RegExp("^(?=.*[\\s]*r([0-9]+))(?=.*[\\s]*c([0-9]+))(?=.*[\\s]*w([0-9]+))(?=.*[\\s]*h([0-9]+)).*$", 'g');

const colors = ["#ffcc00", "#fda45c", "#f07d76", "#b8dbe5", "#aaa9d6", "#ab88b8", "#ab68ab"];

var isIE = false;
if ((/*@cc_on ! @*/ false) || navigator.userAgent.match(/Trident/g)) {
	isIE = true;
}

d3.selection.prototype.first = function() {
	return d3.select(this[0][0]);
};
d3.selection.prototype.last = function() {
	return d3.select(this[0][this.size() - 1]);
};

var avlbPosition = [];
function hasEnoughRoom(row, col, wdth, hght) {
	var endc = col + wdth - 1;
	var endr = row + hght - 1;

	if (avlbPosition[row-1][col-1] > 0) {
		return 4;
	} else if (endc > MAX_COL) {
		return 3;
	} else if (endr > MAX_ROW) {
		return 2;
	} else {
		var okay = true;
		for (var i = row-1; i < endr; i ++) {
			for (var j = col-1; j < endc; j ++) {
				if (avlbPosition[i][j] > 0) {
					okay = false;
					i = endc;
					break;
				}
			}
		}
		if (!okay) {
			return 1;
		} else {
			return 0;
		}
	}
}
function setPositions(row, col, wdth, hght, value, updateUi) {
	var ulist = null;
	if (updateUi) {
		ulist = d3.select(".charts");
	}

	for (var c = col; c < (col + wdth); c ++) {
		for (var r = row; r < (row + hght); r ++) {
			if (updateUi) {
				var elem = ulist.selectAll(".phr.r" + r + ".c" + c + ".w1.h1");
				elem.style("display", (value > 0) ? "none" : null);
			}
			avlbPosition[r-1][c-1] = (value > 0) ? 1 : ((value < 0) ? -1 : 0);
		}
	}
}

var avlbCharts = {};
function addAvailableCharts(obj) {
	avlbCharts[obj.id] = obj;
}

var cfgdCharts = [];
function getCfgdCharts(elmId) {
	for (var i = 0; i < cfgdCharts.length; i ++) {
		if (elmId == cfgdCharts[i].domId) {
			return i;
		}
	}
	return -1;
}

var cfgdCookie = [];

var intervalId = null;

function init() {
	// Initialize the 2-d array marking available space on the grid
	avlbPosition = new Array(MAX_ROW);
	for (var i = 0; i < MAX_ROW; i ++) {
		avlbPosition[i] = new Array(MAX_COL);
		for (var j = 0; j < MAX_COL; j ++) {
			avlbPosition[i][j] = 0;
		}
	}

	// Add dashboard controls and dialogs
	buildFramework();

	// Draw chart grid place holders
	var l1st = d3.select(".charts");
	for (var i = 1; i <= MAX_ROW; i ++) {
		for (var j = 1; j <= MAX_COL; j ++) {
			l1st.append("li")
				.attr("class", "chart phr r" + i + " c" + j + " w1 h1")
				.attr("ondragover", "allowDrop(event)")
				.attr("ondrop", "drop(event)");
		}
	}

	// Add available charts to the config drop-down list
	l1st = d3.select("#config-charts");
	for (var key in avlbCharts) {
		if (avlbCharts[key].id && avlbCharts[key].name) {
			l1st.append("option").attr("value", avlbCharts[key].id).html(avlbCharts[key].name);
		}
	}

	// Add options of no. of rows to drop down boxes.
	l1st = d3.select("#config-row");
	var l2st = d3.select("#config-height");
	for (var i = 1; i <= MAX_ROW; i ++) {
		l1st.append("option").attr("value", i).html(i);
		l2st.append("option").attr("value", i).html(i);
	}

	// Add options of no. of column to drop down boxes.
	l1st = d3.select("#config-col");
	l2st = d3.select("#config-width");
	for (var i = 1; i <= MAX_COL; i ++) {
		l1st.append("option").attr("value", i).html(i);
		l2st.append("option").attr("value", i).html(i);
	}

	// Start configured charts
	var cooks = document.cookie.split(";");
	var chrts = "";
	for (var idx = 0; idx < cooks.length; idx ++) {
		var cok = cooks[idx].trim();
		var pos = cok.indexOf(COK_PFX);
		if (pos >= 0) {
			chrts = cok.substring(pos + COK_PFX.length, cok.length);
			break;
		}
	}

	// Default charts
	if ((chrts.trim() == "") || (chrts.trim() == "[]")) {
		console.log("Displaying default charts...");
		//chrts = '[{"chartId":"sample-topten","row":1,"column":1,"width":4,"height":4,"topCnt":10,"sortBy":"out","sameSc":"yes"},{"chartId":"datetime-widget","row":1,"column":7,"width":1,"height":1,"source":"Server","format":"24","url":"https://dev.echeque.hkicl.com.hk/dashboard/datetime.json"},{"chartId":"sample-pie","row":1,"column":5,"width":2,"height":2,"topCnt":5},{"chartId":"sample-gauge","row":2,"column":7,"width":1,"height":1,"min":0,"max":50,"alert1":35,"alert2":45},{"chartId":"sample-candle","row":3,"column":5,"width":3,"height":3,"selected":"004"}]';
		chrts = '[{"chartId":"block-illust","row":1,"column":1,"width":5,"height":2,"selected":"-1"},' +
				' {"chartId":"illust-peers","row":1,"column":7,"width":2,"height":2},' +
				' {"chartId":"brate-illust","row":2,"column":6,"width":1,"height":1,"min":0,"max":10,"alert1":7,"alert2":9},' +
				' {"chartId":"datetime-widget","row":1,"column":6,"width":1,"height":1,"source":"Server","format":"24","url":"http://localhost:8080/time"}]';
	}

	var startDelay = 1;
	if (chrts.trim() != "") {
		var last = JSON.parse(chrts);
		for (var idx = 0; idx < last.length; idx ++) {
			setTimeout(function(obj) {
					showChart(obj.chartId, obj.row, obj.column, obj.width, obj.height, obj);
			}, 100 * (idx + 1), last[idx]);
		}
		startDelay = last.length;
		if (startDelay < 1) startDelay = 1;
	}

	setTimeout(function() {
			start();
	}, 100 * startDelay);
}

function start() {
	var obj = this;
	intervalId = setInterval(function() {
			for (var idx = 0; idx < cfgdCharts.length; idx ++) {
				if (cfgdCharts[idx] && (typeof cfgdCharts[idx].render === "function") && cfgdCharts[idx].shouldRun()) {
					cfgdCharts[idx].render();
				}
			}
	}, RUN_INTERVAL);
}

function stop() {
	clearInterval(intervalId);
	intervalId = null;
}

addEventListener('click', function(event) {
		var idx;
		switch (event.target.tagName) {
		case "IMG":
			event.preventDefault();
			switch (event.target.id) {
			case "doc-refresh":
				location.reload(true);
				break;

			case "doc-config":
				d3.select("#config-dialog").style("display", "block");
				d3.select("#disable-bg").style("display", "block");
				d3.select("#config-form").node().reset();
				d3.select("#config-row").node().value = 1;
				d3.select("#config-row").attr("disabled", null);
				d3.select("#config-col").node().value = 1;
				d3.select("#config-col").attr("disabled", null);
				break;

			case "doc-control":
				if (intervalId) {
					stop();
					event.target.src = IMG_PLAY;
				} else {
					start();
					event.target.src = IMG_PAUSE;
				}
				break;

			default:
				if (event.target.parentElement && event.target.parentElement.parentElement) {
					var elem = event.target.parentElement.parentElement;
					idx = getCfgdCharts(elem.id);
					if (idx >= 0) {
						if (typeof cfgdCharts[idx].config === "function") {
							// Show chart setup dialog
							cfgdCharts[idx].config(d3.select("#setting-custom"));
							d3.select("#setting-okay").style("display", null);
						} else {
							d3.select("#setting-okay").style("display", "none");
						}
						d3.select("#setting-name").html(cfgdCharts[idx].name);
						d3.select("#setting-charts").node().value = cfgdCharts[idx].domId;
						d3.select("#setting-dialog").style("display", "block");
						d3.select("#disable-bg").style("display", "block");
					}
				}
				break;
			}
			break;

		case "INPUT":
			switch (event.target.name) {
			case "config-clear":
				if (confirm("Remove all charts?")) {
					while (cfgdCharts.length > 0) {
						removeChart(cfgdCharts[0].domId);
					}
				}
				d3.select("#config-dialog").style("display", "none");
				d3.select("#disable-bg").style("display", "none");
				d3.select("#setting-init").html("");
				d3.selectAll(".hrule").style("display", "none");
				break;

			case "config-okay":
				var row = parseInt(d3.select("#config-row").node().value);
				var col = parseInt(d3.select("#config-col").node().value);
				var wdt = parseInt(d3.select("#config-width").node().value);
				var hgt = parseInt(d3.select("#config-height").node().value);
				var eid = d3.select("#config-charts").node().value; // This is the chart's id, not the DOM id.

				if (eid != "-") {
					if (typeof avlbCharts[eid].configed === "function") {
						avlbCharts[eid].configed(eid, function() {
								var cook = avlbCharts[eid].toCookie(row, col, wdt, hgt);
								showChart(eid, row, col, wdt, hgt, cook);
						});
					} else {
						showChart(eid, row, col, wdt, hgt);
					}
				}
				// Don't need to break here...
			case "config-cancel":
				d3.select("#config-dialog").style("display", "none");
				d3.select("#disable-bg").style("display", "none");
				d3.select("#setting-init").html("");
				d3.selectAll(".hrule").style("display", "none");
				break;

			case "setting-remove":
				removeChart(d3.select("#setting-charts").node().value);
				d3.select("#setting-dialog").style("display", "none");
				d3.select("#disable-bg").style("display", "none");
				d3.select("#setting-custom").html("");
				break;

			case "setting-okay":
				var rid = d3.select("#setting-charts").node().value;
				idx = getCfgdCharts(rid);
				if (idx >= 0) {
					if (typeof cfgdCharts[idx].configed === "function") {
						cfgdCharts[idx].configed(rid, function() {
								updateCookie(rid);
								if (typeof cfgdCharts[idx].render === "function") {
									cfgdCharts[idx].render();
								}
						});
					}
				}
				// Don't need to break here...
			case "setting-cancel":
				d3.select("#setting-dialog").style("display", "none");
				d3.select("#disable-bg").style("display", "none");
				d3.select("#setting-custom").html("");
				break;
			}

			break;
		}
});

addEventListener('dblclick', function(event) {
		// No chart setup at this position yet, show add charts dialog
		var grid = getGrid(event.target);
		if (grid) {
			d3.select("#config-dialog").style("display", "block");
			d3.select("#disable-bg").style("display", "block");
			d3.select("#config-form").node().reset();
			d3.select("#config-row").node().value = grid.row;
			d3.select("#config-row").attr("disabled", "");
			d3.select("#config-col").node().value = grid.column;
			d3.select("#config-col").attr("disabled", "");
		}
});

addEventListener('change', function(event) {
		if (event.target.id) {
			switch (event.target.id) {
			case "config-charts":
				event.preventDefault();
				if (avlbCharts[event.target.value].minGridWdth) {
					d3.select("#config-width").node().value = avlbCharts[event.target.value].minGridWdth;
				}
				if (avlbCharts[event.target.value].minGridHght) {
					d3.select("#config-height").node().value = avlbCharts[event.target.value].minGridHght;
				}
				if (typeof avlbCharts[event.target.value].config === "function") {
					avlbCharts[event.target.value].config(d3.select("#setting-init"));
					d3.selectAll(".hrule").style("display", null);
				} else {
					d3.select("#setting-init").html("");
					d3.selectAll(".hrule").style("display", "none");
				}
				break;
			}
		}
});

/*
 * Clone, display and start a chart on the specific position.
 * elmId - Unique ID of the chart object, not the ID used in DOM.
 */
function showChart(elmId, row, col, wdth, hght, cook) {
	var domId = elmId + row + col;
	if (getCfgdCharts(domId) < 0) {
		switch (hasEnoughRoom(row, col, wdth, hght)) {
		case 4:
			alert("Position " + row + ", " + col + " already occupied.");
			break;
		case 3:
			alert("Chart '" + avlbCharts[elmId].name + "' is too wide for the available space.");
			break;
		case 2:
			alert("Chart '" + avlbCharts[elmId].name + "' is too tall for the available space.");
			break;
		case 1:
			alert("There is not enough room to fit the chart '" + avlbCharts[elmId].name + "'");
			break;
		case 0:
			var objt = new avlbCharts[elmId].constructor(domId);
			var cntr = d3.select(".charts")
				.append("li")
					.attr("id", domId).attr("class", "chart tbl r" + row + " c" + col + " w" + wdth + " h" + hght)
					.attr("ondragstart", "drag(event)").attr("ondragend", "dragEnded(event)");
			if (DRAG_CHART_ENABLED) cntr.attr("draggable", "true");
			cntr.append("a").attr("class", "chart-cntrl").attr("href", "javascript:;").append("img").attr("src", IMG_SETTING);
			cntr.append("div").attr("class", "chart-ctnt " + elmId).attr("id", domId + "Container");

			if (typeof objt.buildUi === "function") {
				objt.buildUi(function(data) {
						cntr.select(".chart-ctnt").html(data);

						setPositions(row, col, wdth, hght, 1 , true);

						if (typeof objt.fromCookie === "function") {
							objt.fromCookie(cook);
						}

						if (typeof objt.start === "function") {
							objt.start();
						}

						cfgdCharts[cfgdCharts.length] = objt;
						addCookie(domId, elmId, row, col, wdth, hght);
				});
			} else {
				setPositions(row, col, wdth, hght, 1, true);

				if (typeof objt.fromCookie === "function") {
					objt.fromCookie(cook);
				}

				if (typeof objt.start === "function") {
					objt.start();
				}

				cfgdCharts[cfgdCharts.length] = objt;
				addCookie(domId, elmId, row, col, wdth, hght);
			}
			break;
		}
	} else {
		alert("Chart " + domId + " already exists");
	}
}

function removeChart(rid) {
	var chart = d3.select("#"+rid);
	if (chart) {
		var grid = getGrid(chart.node());
		if (grid) {
			var idx = getCfgdCharts(rid);
			if (idx >= 0) {
				removeCookie(cfgdCharts[idx].id, grid.row, grid.column);
				cfgdCharts.splice(idx, 1);
			}
			chart.remove();
			setPositions(grid.row, grid.column, grid.width, grid.height, 0, true);
		}
	}
}

function addCookie(domId, elmId, row, col, wdth, hght) {
	var cook = {};
	var idx = getCfgdCharts(domId);
	if ((idx >= 0) && (typeof cfgdCharts[idx].toCookie === "function")) {
		cook = cfgdCharts[idx].toCookie(row, col, wdth, hght);
	} else {
		cook[KEY_CHART] = elmId;
		cook[KEY_ROW] = row;
		cook[KEY_COL] = col;
		cook[KEY_WDTH] = wdth;
		cook[KEY_HGHT] = hght;
	}
	cfgdCookie[cfgdCookie.length] = cook;

	var expr = new Date();
	expr.setYear(expr.getFullYear() + 1);
	document.cookie = COK_PFX + JSON.stringify(cfgdCookie) + "; expires=" + expr.toUTCString();

	return cook;
}

function updateCookie(domId) {
	var cook = {};
	var i = getCfgdCharts(domId);
	if ((i >= 0) && (typeof cfgdCharts[i].toCookie === "function")) {
		for (var j = 0; j < cfgdCookie.length; j ++) {
			var row = cfgdCookie[j].row;
			var col = cfgdCookie[j].column;
			var wdth = cfgdCookie[j].width;
			var hght = cfgdCookie[j].height;
			if ((cfgdCookie[j].chartId + row + col) == domId) {
				cfgdCookie[j] = cfgdCharts[i].toCookie(row, col, wdth, hght);

				var expr = new Date();
				expr.setYear(expr.getFullYear() + 1);
				document.cookie = COK_PFX + JSON.stringify(cfgdCookie) + "; expires=" + expr.toUTCString();
				break;
			}
		}
	}
}

function removeCookie(elmId, row, col) {
	var cook = {};
	for (var idx = 0; idx < cfgdCookie.length; idx ++) {
		if ((cfgdCookie[idx].chartId == elmId) && (cfgdCookie[idx].row == row) && (cfgdCookie[idx].column == col)) {
			cook = cfgdCookie[idx];
			cfgdCookie.splice(idx, 1);
			break;
		}
	}

	var expr = new Date();
	expr.setYear(expr.getFullYear() + 1);
	document.cookie = COK_PFX + JSON.stringify(cfgdCookie) + "; expires=" + expr.toUTCString();

	return cook;
}

function getGrid(element) {
	regex.lastIndex = 0;
	var matches = regex.exec(element.className);

	if (matches) {
		var r = parseInt(matches[1]);
		var c = parseInt(matches[2]);
		var w = parseInt(matches[3]);
		var h = parseInt(matches[4]);

		if ((r > 0) && (r <= MAX_ROW) && (c > 0) && (c <= MAX_COL) && (w > 0) && (w <= MAX_COL) && (h > 0) && (h <= MAX_ROW)) {
			var rtn = {};
			rtn[KEY_ROW] = r;
			rtn[KEY_COL] = c;
			rtn[KEY_WDTH] = w;
			rtn[KEY_HGHT] = h;
			return rtn;
		}
	}

	return null;
}

// **** Drag & Drop functions ****
function drag(event) {
	var domId = event.target.id;
	var idx = getCfgdCharts(domId);
	if (idx >= 0) {
		var obj = getGrid(event.target);
		obj.idx = idx;
		obj.id = cfgdCharts[idx].id;
		obj.domId = cfgdCharts[idx].domId;
		event.dataTransfer.setData("text", JSON.stringify(obj));

		setTimeout(function() {
				d3.select(".charts").select("#"+domId).style("visibility", "hidden");
				setPositions(obj[KEY_ROW], obj[KEY_COL], obj[KEY_WDTH], obj[KEY_HGHT], 0, true);
		}, 1);
	}
}

function allowDrop(event) {
	event.preventDefault();
}

function drop(event) {
	event.preventDefault();
	var obj = JSON.parse(event.dataTransfer.getData("text"));
	var grd = getGrid(event.target);
	if (hasEnoughRoom(grd[KEY_ROW], grd[KEY_COL], obj[KEY_WDTH], obj[KEY_HGHT]) == 0) {
		var cook = removeCookie(obj.id, obj.row, obj.column);
		cook.row = grd.row;
		cook.column = grd.column;
		removeChart(obj.domId);
		showChart(obj.id, grd.row, grd.column, obj.width, obj.height, cook);
	} else {
		dragCanceled(obj.domId, obj[KEY_ROW], obj[KEY_COL], obj[KEY_WDTH], obj[KEY_HGHT]);
	}
}

function dragEnded(event) {
	event.preventDefault();
	if (event.dataTransfer.dropEffect == "none") {
		var domId = event.target.id;
		var idx = getCfgdCharts(domId);
		if (idx >= 0) {
			var obj = getGrid(event.target);
			dragCanceled(domId, obj[KEY_ROW], obj[KEY_COL], obj[KEY_WDTH], obj[KEY_HGHT]);
		}
	}
}

function dragCanceled(domId, row, col, wdth, hght) {
	setPositions(row, col, wdth, hght, 1, true);
	d3.select(".charts").select("#"+domId).style("visibility", "visible");
}

// **** Util functions ****
function accessData(url, callBack, cnt) {
	var xmlhttp = new XMLHttpRequest();

	if (!cnt) cnt = 0;
	xmlhttp.onreadystatechange = function() {
		if ((xmlhttp.readyState == 4) && (xmlhttp.status == 200)) {
			try {
				callBack(JSON.parse(xmlhttp.responseText));
			} catch (e) {
				if (e.message.startsWith("Unexpected end of input") && (cnt < 3)) {
					setTimeout(function() { accessData(url, callBack, cnt+1); }, 100);
					return;
				} else if (cnt >= 3) {
					console.log("Retry " + cnt + " times for error '" + e.message + "'");
				} else {
					console.log(e);
				}
			}
		}
	};
	xmlhttp.ontimeout = function() {
		console.log("Request to " + url + " timed out");
	}
	xmlhttp.open("GET", url, true);
	xmlhttp.timeout = 1500;
	xmlhttp.send();
}

function buildCss(headerHeight) {
	if (!headerHeight) headerHeight = topMargin;

	var buff = '';
	for (var i = 1; i <= MAX_ROW; i ++) {
		buff += '.h' + i + ' { height: calc(((100% - ' + (headerHeight + btmMargin) + 'px) / ' + MAX_ROW + ') * ' + i + ' - ' + (cellGap * 2) + 'px); }\n';
		buff += '.r' + i + ' { top: calc(((100% - ' + (headerHeight + btmMargin) + 'px) / ' + MAX_ROW + ') * ' + (i - 1) + ' + ' + (cellGap + headerHeight) + 'px); }\n';
	}
	for (var i = 1; i <= MAX_COL; i ++) {
		buff += '.w' + i + ' { width: calc(((100% - ' + (lftMargin + rgtMargin) + 'px) / ' + MAX_COL + ') * ' + i + ' - ' + (cellGap * 2) + 'px); }\n';
		buff += '.c' + i + ' { left: calc(((100% - ' + (lftMargin + rgtMargin) + 'px) / ' + MAX_COL + ') * ' + (i - 1) + ' + ' + (cellGap + lftMargin) + 'px); }\n';
	}

	d3.select("head").append("style").html(buff);
}

function buildFramework() {
	var body = d3.select("body");

	var list = body.select(".charts");
	if (list.empty()) {
		list = body.append("ul").attr("class", "charts");
	}
	list.style("list-style", "none");

	var dimen = list.node().getBoundingClientRect(); // Get height of header
	buildCss(dimen.top);

	// Controls
	var ctrl = body.append("div").attr("class", "tbl master-cntrl");
	ctrl.append("a").attr("href", "javascript:;").append("img").attr("id", "doc-refresh").attr("src", IMG_REFRESH);
	ctrl.append("span").html("&nbsp;");
	ctrl.append("a").attr("href", "javascript:;").append("img").attr("id", "doc-control").attr("src", IMG_PAUSE);
	ctrl.append("span").html("&nbsp;");
	ctrl.append("a").attr("href", "javascript:;").append("img").attr("id", "doc-config").attr("src", IMG_CONFIG);

	body.append("div").attr("id", "disable-bg"); // Transparent dark background when dialog boxes displayed

	// Control dialog
	var tabl = body.append("div").attr("id", "config-dialog")
		.append("form").attr("id", "config-form").attr("name", "config-form")
		.append("table").attr("class", "dialog");
	var trow = tabl.append("tr");
	trow.append("td").style("text-align", "right").html("Charts:");
	trow.append("td")
		.append("select").attr("id", "config-charts").attr("name", "config-charts")
		.append("option").attr("value", "-").html("-- Select --");
	trow = tabl.append("tr");
	trow.append("td").style("text-align", "right").html("Row:");
	trow.append("td").style("padding-left", "15px")
		.append("select").attr("id", "config-row").attr("name", "config-row");
	trow = tabl.append("tr");
	trow.append("td").style("text-align", "right").html("Column:");
	trow.append("td").style("padding-left", "15px")
		.append("select").attr("id", "config-col").attr("name", "config-col");
	trow = tabl.append("tr");
	trow.append("td").style("text-align", "right").html("Width:");
	trow.append("td").style("padding-left", "15px")
		.append("select").attr("id", "config-width").attr("name", "config-width");
	trow = tabl.append("tr");
	trow.append("td").style("text-align", "right").html("Height:");
	trow.append("td").style("padding-left", "15px")
		.append("select").attr("id", "config-height").attr("name", "config-height");
	tabl.append("tbody").attr("class", "hrule").style("display", "none")
		.append("tr").append("td").attr("colspan", "2").style("text-align", "center").append("hr");
	tabl.append("tbody").attr("id", "setting-init");
	tabl.append("tbody").attr("class", "hrule").style("display", "none")
		.append("tr").append("td").attr("colspan", "2").style("text-align", "center").append("hr");
	var tcll = tabl.append("tr").append("td").attr("colspan", "2").style("text-align", "right");
	tcll.append("input").attr("type", "button").attr("name", "config-clear").attr("value", "Remove all");
	tcll.append("span").html("&nbsp;&nbsp;");
	tcll.append("input").attr("type", "button").attr("name", "config-okay").attr("value", "Okay");
	tcll.append("input").attr("type", "button").attr("name", "config-cancel").attr("value", "Cancel");

	// Setting dialog
	tabl = body.append("div").attr("id", "setting-dialog")
		.append("form").attr("id", "setting-form").attr("name", "setting-form")
		.append("table").attr("class", "dialog");
	tcll = tabl.append("tbody").append("tr").append("td").attr("colspan", "2");
	tcll.append("span").attr("id", "setting-name");
	tcll.append("span").html("&nbsp;");
	tcll.append("input").attr("type", "button").attr("name", "setting-remove").attr("value","Remove");
	tabl.append("tbody").attr("id", "setting-custom");
	tcll = tabl.append("tr").append("td").attr("colspan", "2").style("text-align", "right");
	tcll.append("input").attr("type", "button").attr("name", "setting-okay").attr("id", "setting-okay").attr("value", "Okay");
	tcll.append("input").attr("type", "button").attr("name", "setting-cancel").attr("value", "Cancel");
	tcll.append("input").attr("type", "hidden").attr("id", "setting-charts").attr("name", "setting-charts");
}

// **** Chart prototype ****
function Chart(chartId) {
	this.id = "chart-proto"; //Chart ID
	this.name = "Chart Prototype";
	this.domId = (!chartId) ? this.id : chartId; //Element ID in DOM

	this.chartWdth = -1;
	this.chartHght = -1;

	// Default values
	this.minGridWdth = 1;
	this.minGridHght = 1;
	this.updateInterval = 5000;

	// Interface
	this.start = function() {
		var elmId = "#"+this.domId;
		var size = d3.select(elmId).node().getBoundingClientRect(); //'node()' get the actual DOM object
		var ttld = d3.select(elmId).select(".chart-title");

		this.chartWdth = size.width - 5;
		this.chartHght = size.height - 3;
		var grph = d3.select(elmId).select(".chart-viz");
		if (grph.empty()) {
			grph = d3.select(elmId + "Container").append("svg").attr("class", "chart-viz");
		}
		grph.attr("viewBox", "0 0 " + this.chartWdth + " " + this.chartHght)
			.attr("preserveAspectRatio", "none");

		if (isIE) {
			d3.select(elmId).select(".chart-ctnt").style("height", this.chartHght + "px");
		}

		if (typeof this.init === "function") {
			this.init();
		}

		if (typeof this.render === "function") {
			this.render();
		}
	};

	var elapse = this.updateInterval;
	this.shouldRun = function() {
		elapse -= RUN_INTERVAL;
		if (elapse <= 0) {
			elapse = this.updateInterval;
			return true;
		} else {
			return false;
		}
	};
	this.runNow = function() {
		elapse = 0;
	};

	/*
	this.init = function() { };
	this.render = function() { };
	this.config = function(element) { };
	this.configed = function(domId, func) { };
	this.buildUi = function(func) { };
	this.fromCookie = function(cook) { };
	this.toCookie = function(row, col, wdth, hght) { };
	*/
}

var timeFormatSrver = d3.time.format("%Y-%m-%d %H:%M:%S");
var timeFormatClk12 = d3.time.format("%I:%M");
var timeFormatClk13 = d3.time.format("%p");
var timeFormatClk24 = d3.time.format("%H:%M");
var timeFormatScond = d3.time.format("%S");
var timeFormatClndr = d3.time.format("%d %b %Y");
var timeFormatWeekn = d3.time.format("%A");

DateTimeWidget = function(chartId) {
	this.id = "datetime-widget"; //Chart ID
	this.name = "Date and Time";
	this.updateInterval = 1000;

	this.domId = (!chartId) ? this.id : chartId; //Element ID in DOM

	this.source = "Server"; // 'Local' - PC time, 'Server' - Server time, require URL 
	this.format = "12"; // '12' - 12 hour format with am/pm, '24' - 24 hour format from 00 to 23
	this.url = "https://[dashboard]/time";

	this.render = function() {
		var neti = d3.select("#"+this.domId).select(".chart-indct");
		if (neti.empty()) {
			neti = d3.select("#"+this.domId).append("img").attr("src", IMG_NETWORK).attr("class", "chart-indct");
		}

		if (this.source == "Local") {
			neti.style("display", "none");
			this.redraw(new Date());
		} else {
			neti.style("display", null);
			var obj = this;
			accessData(this.url, function(rspn) {
				if (rspn) {
					obj.redraw(timeFormatSrver.parse(rspn["time"]));
				}
			});
		}
	};

	this.redraw = function(now) {
		var grph = d3.select("#"+this.domId).select(".chart-viz");
		var bbx1, bbx3;

		if (grph.select(".clock.clockBig").empty()) {
			grph.append("text")
				.attr("class", "clock clockBig").attr("x", 10)
				.attr("text-anchor", "start")
				.style("font-size", "4em");
		}
		grph.select(".clock.clockBig").text((this.format == "12") ? timeFormatClk12(now) : timeFormatClk24(now));

		if (grph.select(".clock.clockSmall").empty()) {
			bbx1 = grph.select(".clock.clockBig").node().getBBox();
			grph.append("text")
				.attr("class", "clock clockSmall").attr("x", bbx1.x + bbx1.width + 5)
				.attr("text-anchor", "start")
				.style("font-size", "1.3em");
		}
		grph.select(".clock.clockSmall").text((this.format == "12") ? timeFormatClk13(now) : timeFormatScond(now));

		if (grph.select(".clock.dayofweek").empty()) {
			grph.append("text")
				.attr("class", "clock dayofweek").attr("x", 20)
				.attr("text-anchor", "start")
				.style("font-size", "1.1em");
		}
		grph.select(".clock.dayofweek").text(timeFormatWeekn(now));

		if (grph.select(".clock.calendar").empty()) {
			bbx3 = grph.select(".clock.dayofweek").node().getBBox();
			grph.append("text")
				.attr("class", "clock calendar").attr("x", 20)
				.attr("text-anchor", "start")
				.style("font-size", "1.1em");
		}
		grph.select(".clock.calendar").text(timeFormatClndr(now));

		if (bbx1 && bbx3) {
			var bbx2 = grph.select(".clock.clockSmall").node().getBBox();
			var xfactor = (this.chartWdth - 20) / (bbx1.width + bbx2.width + 5);
			var yfactor = (this.chartHght / 2) / bbx1.height * .85;

			grph.select(".clock.clockBig").attr("transform", "scale(" + xfactor + ", " + yfactor + ")").attr("y", bbx1.height);
			grph.select(".clock.clockSmall").attr("transform", "scale(" + xfactor + ", " + yfactor + ")").attr("y", bbx1.height);
			grph.select(".clock.dayofweek").attr("transform", "scale(" + xfactor + ", " + yfactor + ")").attr("y", bbx1.height * 1.5);
			grph.select(".clock.calendar").attr("transform", "scale(" + xfactor + ", " + yfactor + ")").attr("y", bbx1.height * 1.5 + bbx3.height);
		}
	};

	this.fromCookie = function(cook) {
		if (cook) {
			this.source = cook["source"];
			this.format = cook["format"];
			this.url = cook["url"];
		}
	};

	this.toCookie = function(row, col, wdth, hght) {
		var cook = {};
		cook[KEY_CHART] = this.id;
		cook[KEY_ROW] = row;
		cook[KEY_COL] = col;
		cook[KEY_WDTH] = wdth;
		cook[KEY_HGHT] = hght;
		cook["source"] = this.source;
		cook["format"] = this.format;
		cook["url"] = this.url;
		return cook;
	};

	this.config = function(element) {
		element.html("");

		var trow = element.append("tr");
		trow.append("td").attr("class", "cfgDateTimeWidget").style("text-align", "right")
			.append("input").attr("type", "checkbox").attr("class", "cfgFormat").attr("name", "setting-format");
		trow.append("td").html("Use 24-hour format");

		trow = element.append("tr");
		trow.append("td").attr("class", "cfgDateTimeWidget").style("text-align", "right")
			.append("input").attr("type", "checkbox").attr("class", "cfgSource").attr("name", "setting-source");
		trow.append("td").html("Use server time");

		trow = element.append("tr");
		trow.append("td").attr("colspan", "2").html("&nbsp;&nbsp;Server time URL");
		element.append("tr").append("td").attr("class", "cfgDateTimeWidget").attr("colspan", "2").style("text-align", "right")
			.append("textarea").attr("class", "cfgUrl").style("width", "300px");

		var obj = this;
		setTimeout(function() {
				var ctrls = d3.selectAll(".cfgDateTimeWidget");
				if (obj.format == "24")
					ctrls.select(".cfgFormat").node().checked = true;
				else
					ctrls.select(".cfgFormat").node().checked = false;
				if (obj.source == "Server")
					ctrls.select(".cfgSource").node().checked = true;
				else
					ctrls.select(".cfgSource").node().checked = false;
				ctrls.select(".cfgUrl").node().value = obj.url;
		}, 70);
	};

	this.configed = function(domId, func) {
		if (domId == this.domId) {
			var ctrls = d3.selectAll(".cfgDateTimeWidget");

			if (ctrls.select(".cfgFormat").node().checked) {
				this.format = "24";
			} else {
				this.format = "12";
			}

			if (ctrls.select(".cfgSource").node().checked) {
				this.source = "Server";
				d3.select("#"+this.domId).select(".chart-indct").style("display", null);
			} else {
				this.source = "Local";
				d3.select("#"+this.domId).select(".chart-indct").style("display", "none");
			}

			this.url = ctrls.select(".cfgUrl").node().value;

			func();
		}
	};
};
DateTimeWidget.prototype = new Chart();
DateTimeWidget.prototype.constructor = DateTimeWidget;
addAvailableCharts(new DateTimeWidget());
