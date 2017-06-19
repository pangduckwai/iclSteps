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
    '.pdf' : 'application/pdf',
    '.txt' : 'text/plain',
    '.log' : 'text/plain'
};

var responseNormal = function(resObj, resBdy, cntTyp) {
	resObj.setHeader('Content-type', (!cntTyp) ? 'text/plain' : cntTyp);
	resObj.end(resBdy);
};

var responseError = function(resObj, message, status) {
	console.log(status, message);
	resObj.statusCode = status;
	resObj.setHeader('Content-type', 'text/plain');
	resObj.end(message);
};

var serveFile = function(pathname, encoding, succ, fail) {
	var extn = path.parse(pathname).ext;
	var ctyp = 'text/plain';
	var subt = false;
	if (extn) {
		ctyp = mimeMap[extn] || 'text/plain';
		switch (extn) {
		case '.html':
		case '.js':
		case '.json':
		case '.css':
		case '.svg':
		case '.txt':
		case '.log':
			if ((encoding == null) || (encoding == 'utf8')) subt = true;
			if (encoding == null) encoding = 'utf8';
			break;
		}
	}

	fs.readFile(path.join('.', pathname), encoding, function(error, data) {
			if (error) {
				if (error.code === 'ENOENT') {
					fail(404, 'File ' + pathname + ' not found');
				} else {
					throw err;
				}
			} else {
				if (subt) {
					succ(
						data.replace(/%%%nodeServer%%%/g, "192.168.14.130") //"localhost"
						, ctyp);
				} else {
					succ(data, ctyp);
				}
			}
	});
};

http.createServer(function(req, res) {
	req.on('error', function(err) {
			responseError(res, err, 500);
	});

	res.on('error', function(err) {
			responseError(res, err, 500);
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

			var isPost = (req.method == 'POST');
			if ((!isPost) && (req.method != 'GET')) {
				responseError(res, req.method + ' not supported', 405);
			} else {
				switch (rqst.pathname) {
				case '/':
					responseNormal(res, 'Project Lionrock RTGS Emulator');
					break;

				case '/time':
					var dttm = now.getFullYear() + '-' + ('0'+(now.getMonth() + 1)).slice(-2) + '-' + ('0'+now.getDate()).slice(-2) + ' ' +
						('0'+now.getHours()).slice(-2) + ':' + ('0'+now.getMinutes()).slice(-2) + ':' + ('0'+now.getSeconds()).slice(-2)
					responseNormal(res, '{"time":"' + dttm + '"}', 'application/json');
					break;

				case '/query':
					if (isPost) {
					}
					break;

				case '/pledge':
					if (isPost) {
					}
					break;

				case '/redeem':
					if (isPost) {
					}
					break;

				default:
					serveFile(rqst.pathname, null,
						function(ctn, hdr) {
							responseNormal(res, ctn, hdr);
						},
						function(sts, ctn) {
							responseError(res, ctn, sts);
					});
				}
			}
	});
}).listen(8080);
