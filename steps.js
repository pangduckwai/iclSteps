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

var serveFile = function(pathname, encoding, succ, fail) {
	var extn = path.parse(pathname).ext;

	if (extn) {
		fs.readFile(path.join('.', pathname), encoding, function(error, data) {
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

var buildUi = function(html, msg, user, yr, mn, dt, step, node, state, succ, fail) {
	var ro0 = (state != 1) ? 'readonly' : '';
	var ro1 = ((state == 2) || (state == 3)) ? 'readonly' : '';
	var fcs = (state == 0) ? "step" : "user";
	var act = ((state == 0) || (state == 2)) ? '/submit' : (((state == 1) || (state == 3)) ? '/verify' : '/');
	var canSwitch = (state <= 1) ? 'true' : 'false';
	var mnuHome = (state <= 1) ? "enableAnchor" : "disableAnchor";
	var mnuSbmt = ((state < 0) || (state == 1)) ? "enableAnchor" : "disableAnchor";
	var mnuVrfy = ((state < 0) || (state == 0)) ? "enableAnchor" : "disableAnchor";
	var vsbForm = (state < 0) ? "none" : "block";
	var vsbLink = (state <= 1) ? "none" : "block";
	var vsbBttn = (state <= 1) ? "block" : "none";

	var slt = '';
	for (var i = 0; i < bcNodes.length; i ++) {
		slt += '<option ' + ((i == node) ? 'selected ' : '') + 'value="' + i + '">' + bcNodes[i].name + '</option>';
	}

	serveFile(html, 'utf8',
		function(key, hdr, ctn) {
			succ(ctn
				.replace('%%%message%%%', msg)
				.replace('%%%user%%%', user)
				.replace('%%%year%%%', yr)
				.replace('%%%mnth%%%', mn)
				.replace('%%%date%%%', dt)
				.replace('%%%step%%%', step)
				.replace(/%%%form%%%/g, vsbForm)
				.replace(/%%%focus%%%/g, fcs)
				.replace(/%%%action%%%/g, act)
				.replace(/%%%options%%%/g, slt)
				.replace(/%%%enableNode%%%/g, canSwitch)
				.replace(/%%%readOnlyUser%%%/g, ro0)
				.replace(/%%%readOnlyDate%%%/g, ro1)
				.replace(/%%%readOnlyStep%%%/g, ro1)
				.replace(/%%%anchorHome%%%/g, mnuHome)
				.replace(/%%%anchorSubmit%%%/g, mnuSbmt)
				.replace(/%%%anchorVerify%%%/g, mnuVrfy)
				.replace(/%%%returnLink%%%/g, vsbLink)
				.replace(/%%%formButton%%%/g, vsbBttn)
				.replace(/%%%urlChain%%%/g, protocol + '://' + bcNodes[node].addr + ':' + bcNodes[node].port + '/chain')
				.replace(/%%%urlPeers%%%/g, protocol + '://' + bcNodes[node].addr + ':' + bcNodes[node].port + '/network/peers'));
		},
		function(sts, ctn) {
			fail(sts, ctn);
	});
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
//TEMP!!!!!!!!!!!
ccid = {"0":"00000000000000000000000",
		"1":"11111111111111111111111",
		"2":"22222222222222222222222",
		"3":"33333333333333333333333"};
var depth = 1;
var count = 0;
var fmto = [[0, 3], [0, 4], [0, 5], [1, 7], [2, 7], [3, 7], [3, 6], [2, 6], [2, 5], [1, 5]];
//!!!!!!!!!!!TEMP

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
								buildUi('/dashb.html', bcNodes[node].name + " ready", userName, now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, -1,
									function(htmlBody) {
										res.setHeader('Content-type', 'text/html');
										res.end(htmlBody);
									},
									function(respStatus, errMsg) {
										rspnErr(res, respStatus, errMsg);
								});
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
						buildUi('/dashb.html', 'Hello', userName, now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, -1,
							function(htmlBody) {
								res.setHeader('Content-type', 'text/html');
								res.end(htmlBody);
							},
							function(respStatus, errMsg) {
								rspnErr(res, respStatus, errMsg);
						});
					}
					break;

				case '/submit':
					buildUi('/steps.html', 'Please submit your record', userName, now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, 0,
						function(htmlBody) {
							res.setHeader('Content-type', 'text/html');
							res.end(htmlBody);
						},
						function(respStatus, errMsg) {
							rspnErr(res, respStatus, errMsg);
					});
					break;

				case '/verify':
					buildUi('/steps.html', 'Submitting verification for:', '', now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, 1,
						function(htmlBody) {
							res.setHeader('Content-type', 'text/html');
							res.end(htmlBody);
						},
						function(respStatus, errMsg) {
							rspnErr(res, respStatus, errMsg);
					});
					break;

				case '/ws/temp1':
					var incr = 0;
					switch (Math.floor(Math.random() * 6)) {
					case 0:
						incr = Math.floor(Math.random() * 15) - 5;
						if (incr < 0) incr = 0;
						break;
					case 1:
					case 2:
					case 3:
						incr = 1;
						break;
					}
					depth += incr;
					res.setHeader('Content-type', 'application/json');
					res.end('{ "height" : ' + depth + ', "currentBlockHash" : "RrndKwuojRMjOz/rdD7rJD/NUupiuBuCtQwnZG7Vdi/XXcTd2MDyAMsFAZ1ntZL2/IIcSUeatIZAKS6ss7f' + depth + '"}');
					break;

				case '/ws/temp2':
					var idx = (count ++) % fmto.length;
					var buff = { peers : []};
					var j = fmto[idx][0];
					for (var i = 0; i < (fmto[idx][1] - fmto[idx][0]); i ++) {
						buff.peers[i] = { ID : { name : "vp" + j }, address : "172.18.0." + j + ":7051", type : j, pkiID : "VqDFpP5mW3dMkzK050rl/ax1otqRedEZRKA1o6E70Pk" + j };
						j ++;
					}
					res.setHeader('Content-type', 'application/json');
					res.end(JSON.stringify(buff));
					break;

				default:
					if (rqst.pathname.endsWith('.js')) {
						buildUi(rqst.pathname, '', '', 0, 0, 0, 0, node, 0,
							function(htmlBody) {
								res.setHeader('Content-type', 'text/javascript');
								res.end(htmlBody);
							},
							function(respStatus, errMsg) {
								rspnErr(res, respStatus, errMsg);
						});
					} else {
						serveFile(rqst.pathname, null,
							function(key, hdr, ctn) {
								res.setHeader(key, hdr);
								res.end(ctn);
							},
							function(sts, ctn) {
								rspnErr(res, sts, ctn);
						});
					}
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
					buildUi('/steps.html', mssg, param['user'], param['year'], param['mnth'], param['date'], param['step'], node, 2,
						function(htmlBody) {
							res.setHeader('Content-type', 'text/html');
							res.end(htmlBody);
						},
						function(respStatus, errMsg) {
							rspnErr(res, respStatus, errMsg);
					});
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
					buildUi('/steps.html', mssg, param['user'], param['year'], param['mnth'], param['date'], param['step'], node, 3,
						function(htmlBody) {
							res.setHeader('Content-type', 'text/html');
							res.end(htmlBody);
						},
						function(respStatus, errMsg) {
							rspnErr(res, respStatus, errMsg);
					});
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
