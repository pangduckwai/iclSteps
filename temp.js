const request = require('request');
const http = require('http');
const path = require('path');
const url = require('url');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');

const protocol = 'http';
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

http.createServer(function(req, res) {
	req.on('error', function(err) {
			rspnErr(res, 500, err);
	});

	res.on('error', function(err) {
			console.error(err);
	});

	var rqst = url.parse(req.url, true);

	var buff = '';
	req.on('data', function(chunk) {
			buff += chunk;
			if (buff.length > 1e6) req.connection.destroy(); // data larger than 1M
	}).on('end', function() {
			var qstring = require('querystring');
			var param = qstring.parse(buff);
			var now = new Date();

			switch (req.method) {
			case 'GET':
				switch (rqst.pathname) {
				case '/':
					// Main page listing data
					if (ccid.length > 0) {
						buildUi('/stepsdsh.html', 'Hello', userName, now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, node, -1,
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
					if (times.length < 1) {
						var mill = now.getTime() - 60000; // The previous minute
						for (var i = 0; i < 20; i ++) {
						times[i] = { "time": Math.round(mill/3000)*3, "count": 0 }; //Math.floor(Math.random()*80 + 20) };
							mill += 3000;
						}
					}

					var latst = [];
					var chance;
					for (var key in names) {
						chance = 5;
						for (var i = 0; i < reals.length; i ++) {
							if (key == reals[i]) {
								chance = Math.floor(Math.random()*5) + 6;
								break;
							}
						}
						if (Math.random() < (chance/100)) {
							names[key] ++;
							latst.push(key);
						}
					}
					rtsts.push({"time": Math.round(now.getTime()/1000), "value": latst.length});
					if (rtsts.length > 30) rtsts.shift();

					depth += latst.length;
					var hash = crypto.createHash('sha256').update(depth.toString()).digest('base64');

					var curr = Math.round(now.getTime()/3000)*3;
					if (curr > times[times.length-1].time) {
						times.push({"time": curr, "count": latst.length});
						if (times.length > 20) times.shift();
					} else {
						times[times.length-1].count += latst.length;
					}

					var rate;
					if (rtsts.length > 1) {
						var elpse = rtsts[rtsts.length-1].time - rtsts[0].time;
						var total = 0, lgth = rtsts.length;
						for (var i = 1; i < lgth; i ++) {
							total += rtsts[i].value;
						}
						rate = '{"avg":' + (total/elpse) + '}';
					} else {
						rate = '{"avg":0}';
					}

					res.setHeader('Content-type', 'application/json');
					res.end(
						'{"records": ' + JSON.stringify(latst) + ',' +
						' "blocks": { "height" : ' + depth + ', "currentBlockHash" : "' + hash + '"},' +
						' "rate": ' + rate + ',' +
						' "names": ' + JSON.stringify(names) + ',' +
						' "times": ' + JSON.stringify(times) + '}');
					break;

				case '/ws/temp2': // ************ TEMP - peers ***************
					var objt = { peers : []};
					var lght = 0, j = 0;
					if (count < 3) {
						lght = 5;
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
