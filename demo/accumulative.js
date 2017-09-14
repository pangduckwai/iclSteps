let input = [];

function init() {
	accessData('/data', function(rspn) {
		if (rspn) {
			input = rspn;
			render(rspn);
		}
	});
	
}

function render(src) {
	let grph = d3.select(".viz"); // The chart element (the svg)
	let cntr = d3.select(".viz-cntr"); // Container of the chart element
	let wdth = cntr.node().offsetWidth;
	let hght = cntr.node().offsetHeight;
	
	grph.attr("viewBox", "0 0 " + wdth + " " + hght);

	// *** Convert input data to be accumulative ***
	let data = [];
	let maxv = 0;
	let valu = (src.length > 0) ? src[0].value : 0;
	let date = (src.length > 0) ? new Date(src[0].time).getDate() : -1;
	if (src.length > 0) data.push({ time: new Date(src[0].time), value: valu });
	for (let idx = 1; idx < src.length; idx ++) {
		let time = new Date(src[idx].time);
		if (date !== time.getDate()) {
			date = time.getDate();
			data.push({ time: time, value: (valu + src[idx].value) });
			data.push({ time: time, value: 0 });
			valu = 0;
		} else {
			valu += src[idx].value;
			data.push({ time: time, value: valu });
		}
		if (valu > maxv) maxv = valu;
	}
	console.log("Rendering...", wdth, hght, JSON.stringify(data));

	// *** Acutal rendering of the chart ***
	const marginLeft = 50;
	const marginBttm = 80;

	let numFormat = d3.format(".2s"); // Number format
	let timeFormat = d3.timeFormat("%Y-%m-%d %H:%M");

	let x = d3.scaleTime().rangeRound([marginLeft, wdth - 20]);   //left margin 50px for axis, right margin 20px
	let y = d3.scaleLinear().rangeRound([20, hght - marginBttm]); //bottom margin 50px for axis, top margin 20px

	let line = d3.line()
		.x((d) => { return x(d.time); })
		.y((d) => { return y(d.value); });

	x.domain([data[0].time, data[data.length - 1].time]);
	y.domain([maxv, 0]);

	if (grph.select(".axisy").empty()) {
		grph.append("g").attr("class", "axisy")
			.attr("transform", "translate(" + marginLeft + ", 0)");
	}
	grph.select(".axisy")
		// .transition().duration(1000)
		.call(d3.axisLeft(y).tickFormat(numFormat));

	if (grph.select(".axisx").empty()) {
		grph.append("g").attr("class", "axisx");
	}
	grph.select(".axisx")
		// .transition().duration(1000)
		.call(d3.axisBottom(x).tickFormat(timeFormat).ticks(5));
	grph.select(".axisx")
		.attr("transform", "translate(0, " + (hght - marginBttm) + ")");
	grph.select(".axisx")
		.selectAll("text")
		.attr("transform", "rotate(-40)translate(10, 5)")
		.style("text-anchor", "end");

	if (grph.select(".graph").empty()) {
		grph.append("path").attr("class", "graph")
			.attr("fill", "none")
			.attr("stroke", "black")
			.attr("stroke-width", 1);
	}
	grph.select(".graph")
		.transition()
		.attr("d", line(data));
}

// >>>>> Event handlers <<<<<
addEventListener('resize', (event) => {
	render(input);
});

// >>>>> Common utility functions <<<<<
function accessData(url, callBack, cnt) {
	var xmlhttp = new XMLHttpRequest();

	if (!cnt) cnt = 0;
	xmlhttp.onreadystatechange = function() {
		if ((xmlhttp.readyState == 4) && (xmlhttp.status == 200)) {
			try {
				callBack(JSON.parse(xmlhttp.responseText));
			} catch (e) {
				if ((typeof e.message.startsWith === "function") &&
					e.message.startsWith("Unexpected end of input") && 
					(cnt < 3)) {
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