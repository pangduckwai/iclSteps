const request = require('request');
const http = require('http');
const path = require('path');
const url = require('url');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');

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
	var fcs = "user"; //(state == 0) ? "step" : "user";
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
				.replace(/%%%readOnlyUser%%%/g, ro1) //ro0)
				.replace(/%%%readOnlyDate%%%/g, ro1)
				.replace(/%%%readOnlyStep%%%/g, ro1)
				.replace(/%%%anchorHome%%%/g, mnuHome)
				.replace(/%%%anchorSubmit%%%/g, mnuSbmt)
				.replace(/%%%anchorVerify%%%/g, mnuVrfy)
				.replace(/%%%returnLink%%%/g, vsbLink)
				.replace(/%%%formButton%%%/g, vsbBttn)
				.replace(/%%%nodeServer%%%/g, "192.168.14.130") //"localhost"
				.replace(/%%%urlChain%%%/g, protocol + '://' + bcNodes[node].addr + ':' + bcNodes[node].port + '/chain')
				.replace(/%%%urlBlock%%%/g, protocol + '://' + bcNodes[node].addr + ':' + bcNodes[node].port + '/chain/blocks/')
				.replace(/%%%urlPeers%%%/g, protocol + '://' + bcNodes[node].addr + ':' + bcNodes[node].port + '/network/peers'));
		},
		function(sts, ctn) {
			fail(sts, ctn);
	});
};

var node = -1;
var ccid = "";

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

var write = function(node, key, value, succ, fail) {
	console.log("Writing to " + node + "; key='" + key + "'; value='" + value + "'"); //TODO TEMP!!!
	request({
			uri: protocol + '://' + bcNodes[node].addr + ':' + bcNodes[node].port + '/chaincode',
			method: 'POST',
			json: {
				"jsonrpc": "2.0",
				"method": "invoke",
				"params": {
					"type": 1,
					"chaincodeID": {"name": ccid},
					"ctorMsg": {"function": "invoke", "args": [key, value]},
					"secureContext": bcNodes[node].user
				},
				"id": 1
			}
		},
		function (error, response, body) {
			if (error) {
				fail('Write failed', error);
			} else {
				switch (response.statusCode) {
				case 200:
					if (!body.error) {
						//write successful
						succ(body);
					} else {
						fail(body.error.message, body);
					}
					break;
				default:
					fail('Write result in status ' + response.statusCode, response);
				}
			}
	});
};

var read = function(node, key, succ, fail) {
	console.log("Reading from " + node + "; key='" + key + "'"); //TODO TEMP!!!
	request({
			uri: protocol + '://' + bcNodes[node].addr + ':' + bcNodes[node].port + '/chaincode',
			method: 'POST',
			json: {
				"jsonrpc": "2.0",
				"method": "query",
				"params": {
					"type": 1,
					"chaincodeID": {"name": ccid},
					"ctorMsg": {"function": "query", "args": [key]},
					"secureContext": bcNodes[node].user
				},
				"id": 1
			}
		},
		function (error, response, body) {
			if (error) {
				fail('Read failed', error);
			} else {
				switch (response.statusCode) {
				case 200:
					if (!body.error) {
						//write successful
						succ(body);
					} else {
						fail(body.error.message, body);
					}
					break;
				default:
					fail('Read result in status ' + response.statusCode, response);
				}
			}
	});
};

/*TEMP!!!!!!!!!!!*/
ccid = "00000000000000000000000"
var start = (new Date()).getTime();
var depth = 2;
var count = 0;
var rtsts = [];
var hosts = ['tp0', 'tp1', 'tp2', 'tp3', 'tp4', 'tp5', 'tp6', 'tp7', 'tp8', 'tp9'];
var names = {
	"alan":[0, 3, 7, 0], "alex":[0, 6, 7, 0], "andy":[0, 2, 6, 2], "bill":[0, 4, 3, 1], "carl":[0, 3, 8, 1], "cole":[0, 6, 8, 1],
	"dave":[0, 5, 6, 2], "dale":[0, 9, 3, 1], "dick":[0, 6, 1, 3], "eric":[0, 5, 8, 2], "gary":[0, 3, 6, 1], "gene":[0, 5, 7, 3],
	"greg":[0, 8, 7, 3], "jack":[0, 3, 2, 3], "john":[0, 4, 2, 0], "josh":[0, 9, 7, 0], "kyle":[0, 9, 8, 1], "mark":[0, 1, 3, 1],
	"mike":[0, 2, 8, 2], "nick":[0, 1, 2, 0], "paul":[0, 8, 8, 2], "pete":[0, 3, 3, 2], "phil":[0, 2, 7, 3], "saul":[0, 6, 6, 1],
	"will":[0, 9, 6, 1], "zach":[0, 8, 6, 2]
};
//!!!!!!!!!!!TEMP*/

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
	}).on('end', function() {
			var qstring = require('querystring');
			var param = qstring.parse(buff);
			var now = new Date();

			if (param['node']) node = parseInt(param['node']);
			if (isNaN(node) || (node < 0)) {
				node = 0; //Math.floor(Math.random() * bcNodes.length); TODO TEMP!!!
				console.log("Randomly choosing node " + node); //TODO TEMP!!!
			}

			if (ccid.length <= 0) {
				enroll(node,
					function(bdy) {
						console.log(bdy.OK);
						deploy(node,
							function(body) {
								console.log('Chaincode deployment: ' + body.result.status);
								if (body.result.status == 'OK') {
									ccid = body.result.message;
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
					if (ccid.length > 0) {
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

				case '/time':
					var dttm = now.getFullYear() + '-' + ('0'+(now.getMonth() + 1)).slice(-2) + '-' + ('0'+now.getDate()).slice(-2) + ' ' +
						('0'+now.getHours()).slice(-2) + ':' + ('0'+now.getMinutes()).slice(-2) + ':' + ('0'+now.getSeconds()).slice(-2)
					res.setHeader('Content-type', 'application/json');
					res.end('{"time":"' + dttm + '"}');
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

				case '/ws/temp1': // ************ TEMP - block ***************
					var latst = [];
					for (var key in names) {
						if (Math.random() < 0.1) {
							names[key][0] ++;
							latst.push(key);
						}
					}

					depth += latst.length;

					rtsts.push({"time": Math.round(now.getTime()/1000), "value": latst.length});
					if (rtsts.length > 30) rtsts.shift();

					var hash = crypto.createHash('sha256').update(depth.toString()).digest('base64');
					res.setHeader('Content-type', 'application/json');
					res.end('{ "height" : ' + depth + ', "currentBlockHash" : "' + hash + '"}');
					break;

				case '/ws/temp2': // ************ TEMP - peers ***************
					var objt = { peers : []};
					var lght = 0, j = 0;
					if (count < 3) {
						lght = 3;
					} else if (count < hosts.length) {
						lght = count;
					} else {
						lght = hosts.length;
					}
					//lght = count; //TODO TEMP
					for (var i = 0; i < lght; i ++) {
						if ((count < hosts.length) || ((i < 7) && (Math.random() < 0.9)) || ((i >= 7) && (Math.random() < 0.4))) {
							objt.peers[j] = { ID : { name : hosts[i] }, address : "172.18.0." + i + ":7051", type : (i < 4 ? 1 : 2), pkiID : "VqDFpP5mW3dMkzK050rl/ax1otqRedEZRKA1o6E70Pk" + i };
							j ++;
						}
					}
					count ++;
					//if (count > 5) count = 3; //TODO TEMP
					res.setHeader('Content-type', 'application/json');
					res.end(JSON.stringify(objt));
					break;

				case '/ws/temp4': // ************ TEMP - block rate ***************
					if (rtsts.length > 1) {
						var elpse = rtsts[rtsts.length-1].time - rtsts[0].time;
						var total = 0, lgth = rtsts.length;
						for (var i = 1; i < lgth; i ++) {
							total += rtsts[i].value;
						}
						res.setHeader('Content-type', 'application/json');
						res.end('{"avg":' + (total/elpse) + '}');
					} else {
						res.setHeader('Content-type', 'application/json');
						res.end('{"avg":0}');
					}
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
						// ************ TEMP ***************
						var regex = /.*[/]ws[/]temp3[/]([0-9]+)$/g;
						var mth = regex.exec(rqst.pathname)
						if (mth != null) {
							var hash = crypto.createHash('sha256').update(mth[1]).digest('base64');
							var blck = parseInt(mth[1]);
							var stmp = start / 1000 + blck;
							var rtrn = '{"nonHashData":{"localLedgerCommitTimestamp":{"seconds":' + stmp + '}}';
							if (blck > 0) rtrn += ', "previousBlockHash":"' + hash + '"';
							rtrn += '}';
							res.setHeader('Content-type', 'application/json');
							res.end(rtrn);
							break;
						}
						// ************ TEMP ***************

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
					if (parseInt(param['step']) <= 0) {
						buildUi('/steps.html', param['step'] + ' is not a valid number of steps'
								, param['user'], param['year'], param['mnth'], param['date'], param['step'], node, 2,
							function(htmlBody) {
								res.setHeader('Content-type', 'text/html');
								res.end(htmlBody);
							},
							function(respStatus, errMsg) {
								rspnErr(res, respStatus, errMsg);
						});
					} else {
						var key = param['year'] + ('0'+param['mnth']).slice(-2) + ('0'+param['date']).slice(-2) + param['user'];

						write(node, key, param['step'],
							function(body) {
								console.log('Chaincode write: ' + JSON.stringify(body)); //.result.status); // TODO TEMP
								if (body.result.status == 'OK') {
									mssg = body.result.message;
								}
								buildUi('/steps.html', mssg, param['user'], param['year'], param['mnth'], param['date'], param['step'], node, 2,
									function(htmlBody) {
										res.setHeader('Content-type', 'text/html');
										res.end(htmlBody);
									},
									function(respStatus, errMsg) {
										rspnErr(res, respStatus, errMsg);
								});
							},
							function(mssg, errr) {
								rspnErr(res, 500, errr.error.data);
						});
					}
					break;

				case '/verify':
					var mssg; // = 'Verification submitted, thank you';
					/*if (param['user'] == userName) {
						mssg = 'Cannot verify your own record';
					} else*/
					if (param['user'] == '') {
						mssg = 'Please indicate the user being verified';
					} else if (parseInt(param['step']) <= 0) {
						mssg = param['step'] + ' is not a valid number of steps';
					}

					if (!mssg) {
						var key = param['year'] + ('0'+param['mnth']).slice(-2) + ('0'+param['date']).slice(-2) + param['user'];
						read(node, key,
							function(body) {
								console.log('Chaincode read: ' + body.result.status);
								if (body.result.status == 'OK') {
									mssg = param['user'] + ' took ' + body.result.message;
								}
								buildUi('/steps.html', mssg, param['user'], param['year'], param['mnth'], param['date'], param['step'], node, 3,
									function(htmlBody) {
										res.setHeader('Content-type', 'text/html');
										res.end(htmlBody);
									},
									function(respStatus, errMsg) {
										rspnErr(res, respStatus, errMsg);
								});
							},
							function(mssg, errr) {
								rspnErr(res, 500, errr.error.data);
						});
					} else {
						buildUi('/steps.html', mssg, param['user'], param['year'], param['mnth'], param['date'], param['step'], node, 3,
							function(htmlBody) {
								res.setHeader('Content-type', 'text/html');
								res.end(htmlBody);
							},
							function(respStatus, errMsg) {
								rspnErr(res, respStatus, errMsg);
						});
					}
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
