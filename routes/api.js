
var express = require('express');
var router = express.Router();
var got = require('got');
var stream = require('stream');

var db_url = process.env.DOCSDB_URL;
var pkg_re = new RegExp("^/map/([\\w0-9\\.]+)$");

router.get(pkg_re, function(req, res) {
    var package = req.params[0];
    var url = pkg_url(db_url, package);
    res.set('Content-Type', 'application/json');
    got.stream(url).pipe(res);
});

router.put(pkg_re, function(req, res) {
    var package = req.params[0];
    var auth = db_url.replace(/^http:\/\//, '').replace(/@.*$/, '');
    var url = pkg_url(db_url, package);

    var s = new stream.Readable();
    s._read = function noop() {};
    s.push(JSON.stringify(req.body));
    s.push(null);
    s.pipe(got.stream.put(url, { 'auth': auth }));

    res.send('OK');
});

function pkg_url(db_url, package) {
    return db_url.replace(/^http:\/\/[^@]*@/, 'http://') +
	'/code/' + package;
}

module.exports = router;
