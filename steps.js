var bcNodes = [
	{name : "node 0", addr : "127.0.0.1:7050"},
	{name : "node 1", addr : "127.0.0.1:8050"},
	{name : "node 2", addr : "127.0.0.1:9050"},
	{name : "node 3", addr : "127.0.0.1:10050"},
];

var buildUi = function(msg, user, yr, mn, dt, step, state) {
	var ro0 = (state != 1) ? 'readonly' : '';
	var ro1 = ((state == 2) || (state == 3)) ? 'readonly' : '';
	var fcs = (state == 0) ? "'step'" : "'user'";
	var act = (state == 0) ? '/submit' : '/verify';
	var mnu = (state == 0) ? 'Submit | <a href="/verify">Verify</a>' : ((state == 1) ? '<a href="/submit">Submit</a> | Verify' : 'Submit | Verify');
	var rtn = 
'<html><head><title>HKICL STEPS Contest</title></head>' +
'<body onload="document.getElementById(' + fcs + ').focus();">' +
'<h2>HKICL STEPS Contest</h2>' +
'<div style="font-size:0.8em;">' + mnu + '</div><br/>' +
'<div>' + ((msg == '') ? 'Welcome' : msg) + '</div>' +
'<form action="' + act + '" method="post"><table>' +
'<tr><td>User: </td><td><input type="text" name="user" id="user" value="' + user + '" ' + ro0 + '/></td></tr>' +
'<tr><td>Date: </td><td>' +
'<input type="text" size="4" maxlength="4" name="year" value="' + yr + '" ' + ro1 + '/>' +
'<input type="text" size="2" maxlength="2" name="mnth" value="' + mn + '" ' + ro1 + '/>' +
'<input type="text" size="2" maxlength="2" name="date" value="' + dt + '" ' + ro1 + '/></td></tr>' +
'<tr><td>Steps: </td><td>' +
'<input type="text" size="7" name="step" id="step" value="' + step + '" onfocus="this.select();" ' + ro1 + '/></td></tr>' +
'</table><br/>' + ((state == 2) ? '<a href="/submit">Return</a></div>' : ((state == 3) ? '<a href="/verify">Return</a></div>' : '<input type="submit" value="Send"/><input type="reset" value="Clear"/>')) +
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

	var path = require('path');
	var userName = process.env['USERPROFILE'].split(path.sep)[2];
	var body = '';

	var request = require('request');

	switch (req.method) {
	case 'GET':
		var now = new Date();

		switch (req.url) {
		case '/':
			// Main page listing data
			break;

		case '/init':
			request({
						uri: 'http://127.0.0.1:9050/registrar', 
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
								console.log(JSON.stringify(rspn));
								res.end(buildUi(rspn['OK'], userName, now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, 0));
								break;
							default:
								console.log('Enrollment result in status ' + response.statusCode);
								res.statusCode = 500;
								res.end();
							}
						}
					}
			);
			break;

		case '/submit':
			res.end(buildUi('Please submit your record', userName, now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, 0));
			break;

		case '/verify':
			res.end(buildUi('Submitting verification for:', '', now.getFullYear(), (now.getMonth() + 1), (now.getDate() - 1), 0, 1));
			break;

		default:
			res.statusCode = 404;
			res.end();
		}
		break;

	case 'POST':
		var qs = require('querystring');

		switch (req.url) {
		case '/submit':
			req.on('data', function(chunk) {
					body += chunk;
					if (body.length > 1e6) req.connection.destroy(); // data larger than 1M
			}).on('end', function() {
					var post = qs.parse(body);
					var mssg = 'Record submitted, thank you';
					if (post['user'] != userName) {
						mssg = 'Cannot submit records for another user ' + post['user'];
					} else if (parseInt(post['step']) <= 0) {
						mssg = post['step'] + ' is not a valid number of steps';
					} else {
						// TODO HERE!!! write values
						console.error('Submitting new record');
					}
					res.end(buildUi(mssg, post['user'], post['year'], post['mnth'], post['date'], post['step'], 2));
			});
			break;

		case '/verify':
			req.on('data', function(chunk) {
					body += chunk;
					if (body.length > 1e6) req.connection.destroy(); // data larger than 1M
			}).on('end', function() {
					var post = qs.parse(body);
					var mssg = 'Verification submitted, thank you';
					if (post['user'] == userName) {
						mssg = 'Cannot verify your own record';
					} else if (post['user'] == '') {
						mssg = 'Please indicate the user being verified';
					} else if (parseInt(post['step']) <= 0) {
						mssg = post['step'] + ' is not a valid number of steps';
					} else {
						// TODO HERE!!! verify values
						console.error('Submitting verification');
					}
					res.end(buildUi(mssg, post['user'], post['year'], post['mnth'], post['date'], post['step'], 3));
			});
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
}).listen(8080);
