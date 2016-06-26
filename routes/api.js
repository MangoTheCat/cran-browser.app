
var db_url = process.env.DOCSDB_URL;

var express = require('express');
var router = express.Router();
var got = require('got');
var stream = require('stream');
var url = require('url');
var nano = require('nano')(db_url);

var pkg_re = new RegExp("^/map/([\\w0-9\\.]+)$");

router.get(pkg_re, function(req, res) {
    var package = req.params[0];
    var auth = pkg_url_auth(db_url);
    var url = pkg_url(db_url, package);
    res.set('Content-Type', 'application/json');
    got.stream(url, { auth: auth }).pipe(res);
});

router.put(pkg_re, function(req, res) {
    var package = req.params[0];
    var db = nano.use('code');
    var doc = req.body;

    res.set('Content-Type', 'application/json');

    doc._id = package;

    db.get(package, function(err, body) {
	if (!err) { doc._rev = body._rev; }

	db.insert(doc, package, function(err, body) {
	    if (err) {
		res.send(JSON.stringify({ 'result': 'error', 'error': err }));
	    } else {
		res.send(JSON.stringify({ 'result': 'OK' }));
	    }
	});
    });
});

// Get the auth part only
function pkg_url_auth(db_url) {
    return url.parse(db_url).auth;
}

// Need to drop 'auth' from here
function pkg_url(db_url, package) {
    var parsed = url.parse(db_url);
    parsed.auth = null;
    parsed.path = parsed.pathname = '/code/' + package;
    return url.format(parsed);
}

module.exports = router;
