var bcNodes = [
	{name : "Node 0", addr : "127.0.0.1:7050"},
	{name : "Node 1", addr : "127.0.0.1:8050"},
	{name : "Node 2", addr : "127.0.0.1:9050"},
	{name : "Node 3", addr : "127.0.0.1:10050"},
];

var buildUi = function(msg, user, yr, mn, dt, step, node, state) {
	var ro0 = (state != 1) ? 'readonly' : '';
	var ro1 = ((state == 2) || (state == 3)) ? 'readonly' : '';
	var fcs = (state == 0) ? "'step'" : "'user'";
	var act = (state == 0) ? '/submit' : '/verify';

	var hfs = '<a href="/submit?node=' + node + '">';
	var hfv = '<a href="/verify?node=' + node + '">';
	var mnu = (state == 0) ? 'Submit | ' + hfv + 'Verify</a>' : ((state == 1) ? hfs + 'Submit</a> | Verify' : 'Submit | Verify');

	var sel = '';
	if ((state != 2) && (state !=3)) {
		sel = ' | Connect to <select name="node" value="' + node + '" style="font-size:0.7em;" onchange="this.form.submit()">'
		for (var i = 0; i < bcNodes.length; i ++) {
			sel += '<option ' + ((i == node) ? 'selected ' : '') + 'value="' + i + '">' + bcNodes[i].name + '</option>';
		}
		sel += '</select>';
	}

	var rtn = 
'<html><head><title>HKICL Pedometer Contest</title></head>' +
'<body style="font-family:sans-serif" onload="document.getElementById(' + fcs + ').focus();">' +
'<h2>HKICL Pedometer Contest</h2>' +
'<form action="' + act + '" method="get"><div style="font-size:0.9em;height:21px">' + mnu + sel + '</div></form>' +
'<div style="font-size:1.1em;height:28px">' + ((msg == '') ? 'Welcome' : msg) + '</div>' +
'<form action="' + act + '" method="post"><input type="hidden" name="node" value="' + node + '"/><table>' +
'<tr><td>User: </td><td><input type="text" name="user" id="user" value="' + user + '" ' + ro0 + '/></td></tr>' +
'<tr><td>Date: </td><td>' +
'<input type="text" size="4" maxlength="4" name="year" value="' + yr + '" ' + ro1 + '/>' +
'<input type="text" size="2" maxlength="2" name="mnth" value="' + mn + '" ' + ro1 + '/>' +
'<input type="text" size="2" maxlength="2" name="date" value="' + dt + '" ' + ro1 + '/></td></tr>' +
'<tr><td>Steps: </td><td>' +
'<input type="text" size="7" name="step" id="step" value="' + step + '" onfocus="this.select();" ' + ro1 + '/></td></tr>' +
'</table><br/>' + ((state == 2) ? hfs + 'Return</a></div>' : ((state == 3) ? hfv + 'Return</a></div>' : '<input type="submit" value="Send"/><input type="reset" value="Clear"/>')) +
'</form></body></html>';
	return (rtn);
};

var http = require('http');

http.createServer(function(req, res) {
	req.on('error', function(err) {
			console.error(err);
			res.statusCode = 500;
			res.end();
	});

	res.on('error', function(err) {
			console.error(err);
	});

	var url = require('url');
	var rqst = url.parse(req.url, true);
	var node = (rqst.query['node']) ? parseInt(rqst.query['node']) : -1;

	var path = require('path');
	var userName = process.env['USERPROFILE'].split(path.sep)[2];

	var rspnStr = '';

	req.on('data', function(chunk) {
			rspnStr += chunk;
			if (rspnStr.length > 1e6) req.connection.destroy(); // data larger than 1M
			console.log("DATA: " + chunk); //TODO TEMP!!!
	}).on('end', function() {
			var request = require('request');
			var qstring = require('querystring');
			var param = qstring.parse(rspnStr);

			if (isNaN(node) || (node < 0)) {
				node = (param['node']) ? parseInt(param['node']) : -1;
				if (isNaN(node) || (node < 0)) {
					console.log("Node!: " + node); //TODO TEMP!!!
					node = Math.floor(Math.random() * bcNodes.length);
				}
			}

			switch (req.method) {
			case 'GET':
				var now = new Date();

				switch (rqst.pathname) {
				case '/':
					// Main page listing data
					if (rqst.query['node']) {
						res.end('Node is ' + rqst.query['node']);
					} else {
						res.end('Node is unspecified');
					}
					break;

				case '/init':
					request({
							uri: 'http://' + bcNodes[node].addr + '/registrar', 
							method: 'POST',
							json: {"enrollId": "test_user3", "enrollSecret": "vWdLCE00vJy0"}
						},
						function (error, response, rspn) {
							if (error) {
								console.log(error);
								res.statusCode = 500;
								res.end();
							} else {
								switch (response.statusCode) {
								case 200:
									//login successful, deploying chaincode
									request({
											uri: 'http://' + bcNodes[node].addr + '/registrar', 
											method: 'POST',
											json: {
												"jsonrpc": "2.0",
												"method": "deploy",
												"params": {
													"type": 1,
													"chaincodeID": {"path": "https://github.com/pangduckwai/iclSteps/steps"},
													"ctorMsg": {"function": "init", "args": ["1"]},
													"secureContext": "test_user3"
												},
												"id": 1
											}
										},
										function (error2, response2, rspn2) {
											if (error2) {
												console.log(error2);
												res.statusCode = 500;
												res.end();
											} else {
												switch (response2.statusCode) {
												case 200:
													res.end(buildUi(rspn['OK'], userName, now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, 0));
													break;
												default:
													console.log('Init result in status ' + response2.statusCode);
													res.statusCode = 500;
													res.end();
												}
											}
									});
									break;

								default:
									console.log('Enrollment result in status ' + response.statusCode);
									res.statusCode = 500;
									res.end();
								}
							}
					});
					break;

				case '/submit':
					res.end(buildUi('Please submit your record', userName, now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, 0));
					break;

				case '/verify':
					res.end(buildUi('Submitting verification for:', '', now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, 1));
					break;

				default:
					res.statusCode = 404;
					res.end();
				}
				break;

			case 'POST':
				switch (rqst.pathname) {
				case '/submit':
					var mssg = 'Record submitted, thank you';
					if (param['user'] != userName) {
						mssg = 'Cannot submit records for another user ' + param['user'];
					} else if (parseInt(param['step']) <= 0) {
						mssg = param['step'] + ' is not a valid number of steps';
					} else {
						// TODO HERE!!! write values
						console.error('Submitting new record to node ' + node);
					}
					res.end(buildUi(mssg, param['user'], param['year'], param['mnth'], param['date'], param['step'], node, 2));
					break;

				case '/verify':
					var mssg = 'Verification submitted, thank you';
					if (param['user'] == userName) {
						mssg = 'Cannot verify your own record';
					} else if (param['user'] == '') {
						mssg = 'Please indicate the user being verified';
					} else if (parseInt(param['step']) <= 0) {
						mssg = param['step'] + ' is not a valid number of steps';
					} else {
						// TODO HERE!!! verify values
						console.error('Submitting verification to node ' + node);
					}
					res.end(buildUi(mssg, param['user'], param['year'], param['mnth'], param['date'], param['step'], node, 3));
					break;

				default:
					res.statusCode = 404;
					res.end();
				}
				break;

			default:
				res.statusCode = 405;
				res.end();
			}
	});
}).listen(8080);
