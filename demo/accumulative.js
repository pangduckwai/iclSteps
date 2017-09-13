const DATA_SRC = JSON.stringify([
	{ time: "2017-09-13T22:30:00.000Z", value: 45 },
	{ time: "2017-09-13T22:45:00.000Z", value: 23 },
	{ time: "2017-09-13T23:00:00.000Z", value: 78 },
	{ time: "2017-09-13T23:15:00.000Z", value: 5 },
	{ time: "2017-09-13T23:30:00.000Z", value: 60 },
	{ time: "2017-09-13T23:45:00.000Z", value: 9 },
	{ time: "2017-09-14T00:00:00.000Z", value: 40 },
	{ time: "2017-09-14T00:15:00.000Z", value: 84 },
	{ time: "2017-09-14T00:30:00.000Z", value: 88 },
	{ time: "2017-09-14T00:45:00.000Z", value: 7 },
	{ time: "2017-09-14T01:00:00.000Z", value: 17 },
	{ time: "2017-09-14T01:15:00.000Z", value: 48 },
	{ time: "2017-09-14T01:30:00.000Z", value: 6 },
	{ time: "2017-09-14T01:45:00.000Z", value: 61 },
	{ time: "2017-09-14T02:00:00.000Z", value: 20 }
]);

addEventListener('resize', (event) => {
	render();
});

function init() {
	render();
}

function render() {
	let cntr = d3.select(".viz-cntr");
	let wdth = cntr.node().offsetWidth;
	let hght = cntr.node().offsetHeight;
	let grph = d3.select(".viz");
	
	grph.attr("viewBox", "0 0 " + wdth + " " + hght); //.node().getBoundingClientRect()
	// console.log("Bounding Rect 'p'", size);
	// console.log("Bounding Rect 'svg'", grph.node().getBoundingClientRect());

	let input = JSON.parse(DATA_SRC);
	console.log(input);
	let data = [];
	let valu = 0;
	let date = -1;
	for (let idx = 0; idx < input.length; idx ++) {
		if (date !== input[idx].time.getDate()) {
			date = input[idx].time.getDate();
			valu = 0;
		}
		valu += input[idx].value;
		data.push({ time: input[idx].time, value: valu});
	}

	console.log("Rendering...", wdth, hght, JSON.stringify(data));
}
