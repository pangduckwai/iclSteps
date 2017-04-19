// TODO!!! Learn where to put config params in node.js!!!
const protocol = 'http';
const bcNodes = [
	{name : "Node 0", addr : "192.168.14.130", port : "7050",  user : "test_user0", scrt : "MS9qrN8hFjlE"}, //"127.0.0.1" 7050 8050 9050 10050
	{name : "Node 1", addr : "192.168.14.130", port : "8050",  user : "test_user1", scrt : "jGlNl6ImkuDo"},
	{name : "Node 2", addr : "192.168.14.130", port : "9050",  user : "test_user2", scrt : "zMflqOKezFiA"},
	{name : "Node 3", addr : "192.168.14.130", port : "10050", user : "test_user3", scrt : "vWdLCE00vJy0"},
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

var rspnErr = function(response, status, message) {
	console.log(message);
	response.statusCode = status;
	response.end(message);
};

var request = require('request');

var enroll = function(node, succ, fail) {
	console.log('Enrolling ' + bcNodes[node].user + ' (' + bcNodes[node].scrt + ')');
	request({
			uri: protocol + '://' + bcNodes[node].addr + ':' + bcNodes[node].port + '/registrar', 
			method: 'POST',
			json: {"enrollId": bcNodes[node].user, "enrollSecret": bcNodes[node].scrt}
		},
		function (error, response, body) {
			if (error) {
				fail('Enrollment failed', error);
			} else {
				switch (response.statusCode) {
				case 200:
					//enroll successful
					succ(body);
					break;

				default:
					fail('Enrollment result in status ' + response.statusCode, response);
				}
			}
	});
};

var deploy = function(node, succ, fail) {
	request({
			uri: protocol + '://' + bcNodes[node].addr + ':' + bcNodes[node].port + '/chaincode', 
			method: 'POST',
			json: {
				"jsonrpc": "2.0",
				"method": "deploy",
				"params": {
					"type": 1,
					"chaincodeID": {"path": "https://github.com/pangduckwai/iclSteps/steps"},
					"ctorMsg": {"function": "init", "args": ["1"]},
					"secureContext": bcNodes[node].user
				},
				"id": 1
			}
		},
		function (error, response, body) {
			if (error) {
				fail('Deployment failed', error);
			} else {
				switch (response.statusCode) {
				case 200:
					//deploy successful
					succ(body);
					break;
				default:
					fail('Deployment result in status ' + response.statusCode, response);
				}
			}
	});
};

var http = require('http');
var node = -1;
var ccid = {};

http.createServer(function(req, res) {
	req.on('error', function(err) {
			rspnErr(res, 500, err);
	});

	res.on('error', function(err) {
			console.error(err);
	});

	var url = require('url');
	var rqst = url.parse(req.url, true);

	const os = require('os');
	var path = require('path');
	var userName = null;
	switch (os.platform()) {
	case 'win32':
		userName = process.env['USERPROFILE'].split(path.sep)[2];
		break;
	case 'aix':
	case 'darwin':
	case 'freebsd':
	case 'linux':
	case 'openbsd':
	case 'sunos':
		userName = process.env['LOGNAME'];
		break;
	}

	if (rqst.query['node']) node = parseInt(rqst.query['node']);

	var buff = '';
	req.on('data', function(chunk) {
			buff += chunk;
			if (buff.length > 1e6) req.connection.destroy(); // data larger than 1M
			console.log("DATA: " + chunk); //TODO TEMP!!!
	}).on('end', function() {
			var qstring = require('querystring');
			var param = qstring.parse(buff);
			var now = new Date();

			if (param['node']) node = parseInt(param['node']);
			if (isNaN(node) || (node < 0)) {
				node = Math.floor(Math.random() * bcNodes.length);
				console.log("Randomly choosing node " + node); //TODO TEMP!!!
			}

			if (!ccid[node]) {
				enroll(node,
					function(bdy) {
						console.log(bdy.OK);
						deploy(node,
							function(body) {
								console.log('Chaincode deployment: ' + body.result.status);
								if (body.result.status == 'OK') {
									ccid[node] = body.result.message;
								}
								res.end(buildUi("Deploy successful", userName, now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, 0));
							},
							function(mssg, errr) {
								rspnErr(res, 500, mssg);
							});
					},
					function(msg, err) {
						rspnErr(res, 500, msg);
				});
				return;
			}

			switch (req.method) {
			case 'GET':
				switch (rqst.pathname) {
				case '/':
					// Main page listing data
					if (ccid) {
						res.end('CCID is ' + ccid);
					} else {
						res.end('CCID is unspecified');
						
					}
					break;

				case '/submit':
					res.end(buildUi('Please submit your record', userName, now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, 0));
					break;

				case '/verify':
					res.end(buildUi('Submitting verification for:', '', now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, 1));
					break;

				default:
					rspnErr(res, 404, rqst.pathname + ' not found');
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
					rspnErr(res, 404, rqst.pathname + ' not found');
				}
				break;

			default:
				rspnErr(res, 405, req.method + ' not supported');
			}
	});
}).listen(8080);
