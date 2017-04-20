const request = require('request');
const http = require('http');
const path = require('path');
const url = require('url');
const os = require('os');
const fs = require('fs');

// TODO!!! Learn where to put config params in node.js!!!
const protocol = 'http';
const bcNodes = [
	{name : "Node 0", addr : "127.0.0.1", port : "7050",  user : "test_user0", scrt : "MS9qrN8hFjlE"}, //127.0.0.1 7050 8050 9050 10050
	{name : "Node 1", addr : "127.0.0.1", port : "8050",  user : "test_user1", scrt : "jGlNl6ImkuDo"}, //192.168.14.130
	{name : "Node 2", addr : "127.0.0.1", port : "9050",  user : "test_user2", scrt : "zMflqOKezFiA"},
	{name : "Node 3", addr : "127.0.0.1", port : "10050", user : "test_user3", scrt : "vWdLCE00vJy0"},
];
const mimeMap = {
	'.ico' : 'image/x-icon',
    '.html': 'text/html',
    '.js'  : 'text/javascript',
    '.json': 'application/json',
    '.css' : 'text/css',
    '.png' : 'image/png',
    '.jpg' : 'image/jpeg',
    '.svg' : 'image/svg+xml',
    '.pdf' : 'application/pdf'
};

var rspnErr = function(response, status, message) {
	console.log(message);
	response.statusCode = status;
	response.end(message);
};

var serveFile = function(jsonUrl, succ, fail) {
	var pathname = jsonUrl.pathname;
	var extn = path.parse(pathname).ext;

	if (extn) {
		fs.readFile(path.join('.', pathname), function(error, data) {
				if (error) {
					if (error.code === 'ENOENT') {
						fail(404, 'File ' + pathname + ' not found');
					} else {
						throw err;
					}
				} else {
					succ('Content-type', mimeMap[extn] || 'text/plain', data);
				}
		});
	}
};

var buildUi = function(msg, user, yr, mn, dt, step, node, state) {
	var ro0 = (state != 1) ? 'readonly' : '';
	var ro1 = ((state == 2) || (state == 3)) ? 'readonly' : '';
	var fcs = (state == 0) ? "'step'" : "'user'";
	var act = (state == 0) ? '/submit' : ((state == 1) ? '/verify' : '/');

	var hfs = '<a href="/submit?node=' + node + '">';
	var hfv = '<a href="/verify?node=' + node + '">';
	var mnu = (state == 0) ? 'Submit | ' + hfv + 'Verify</a>' : ((state == 1) ? hfs + 'Submit</a> | Verify' : ((state < 0) ? hfs + 'Submit</a> | ' + hfv + 'Verify</a>' : 'Submit | Verify'));
	var rtn = (state == 2) ? hfs + 'Return</a></div>' : ((state == 3) ? hfv + 'Return</a></div>' : '<input type="submit" value="Send"/><input type="reset" value="Clear"/>');

	var slt = '';
	if ((state >= 0) && (state != 2) && (state != 3)) {
		slt = ' | Connect to <select name="node" value="' + node + '" style="font-size:0.7em;" onchange="this.form.submit()">'
		for (var i = 0; i < bcNodes.length; i ++) {
			slt += '<option ' + ((i == node) ? 'selected ' : '') + 'value="' + i + '">' + bcNodes[i].name + '</option>';
		}
		slt += '</select>';
	}

	var hdr =
'<html><head><title>HKICL Pedometer Contest</title></head>' +
'<body style="font-family:sans-serif" onload="document.getElementById(' + fcs + ').focus();">' +
'<h2><img src="logo.png" style="vertical-align:middle;width:72;height:72"/>HKICL Pedometer Contest</h2>' +
'<form action="' + act + '" method="get"><div style="font-size:0.9em;height:21px"><a href="/">Home</a> | ' + mnu + slt + '</div></form>' +
'<div style="font-size:1.1em;height:28px">' + ((msg == '') ? 'Welcome' : msg) + '</div>';

	var ctn = (state < 0) ?
('<h1>Draw some blockchains here!</1>')
:
('<form action="' + act + '" method="post"><input type="hidden" name="node" value="' + node + '"/><table>' +
 '<tr><td>User: </td><td><input type="text" name="user" id="user" value="' + user + '" ' + ro0 + '/></td></tr>' +
 '<tr><td>Date: </td><td>' +
 '<input type="text" size="4" maxlength="4" name="year" value="' + yr + '" ' + ro1 + '/>' +
 '<input type="text" size="2" maxlength="2" name="mnth" value="' + mn + '" ' + ro1 + '/>' +
 '<input type="text" size="2" maxlength="2" name="date" value="' + dt + '" ' + ro1 + '/></td></tr>' +
 '<tr><td>Steps: </td><td>' + '<input type="text" size="7" name="step" id="step" value="' + step + '" onfocus="this.select();" ' + ro1 + '/></td></tr>' +
 '</table><br/>' + rtn + '</form>');

	var ftr = '</body></html>';

	return (hdr + ctn + ftr);
};

// Webservices
var queryChain = function(node, succ, fail, blck) {
	request(protocol + '://' + bcNodes[node].addr + ':' + bcNodes[node].port + '/chain' + ((blck) ? '/block/' + blck : ''),
		function (error, response, body) {
			if (error) {
				fail('Read chain failed', error);
			} else {
				switch (response.statusCode) {
				case 200:
					succ(body);
					break;
				default:
					fail('Read chain result in status ' + response.statusCode, response);
				}
			}
	});
};

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
					"chaincodeID": {"path": "https://github.com/pangduckwai/iclSteps/chaincode"},
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
					if (!body.error) {
						//deploy successful
						succ(body);
					} else {
						fail(body.error.message, body);
					}
					break;
				default:
					fail('Deployment result in status ' + response.statusCode, response);
				}
			}
	});
};

var node = -1;
var ccid = {};

http.createServer(function(req, res) {
	req.on('error', function(err) {
			rspnErr(res, 500, err);
	});

	res.on('error', function(err) {
			console.error(err);
	});

	var rqst = url.parse(req.url, true);

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
								res.end(buildUi("Deploy successful", userName, now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, -1));
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
						queryChain(node,
							function(body) {
								res.end(buildUi(body, userName, now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, -1));
							},
							function(mssg, errr) {
								rspnErr(res, 500, mssg);
						});
					}
					break;

				case '/submit':
					res.end(buildUi('Please submit your record', userName, now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, 0));
					break;

				case '/verify':
					res.end(buildUi('Submitting verification for:', '', now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, 1));
					break;

				default:
					serveFile(rqst,
						function(key, hdr, ctn) {
							res.setHeader(key, hdr);
							res.end(ctn);
						},
						function(sts, ctn) {
							rspnErr(res, sts, ctn);
					});
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
