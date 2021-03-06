
var db_url = process.env.DOCSDB_URL;

var express = require('express');
var router = express.Router();
var got = require('got');
var stream = require('stream');
var url = require('url');
var nano = require('nano')(db_url);
var isarray = require('isarray');

var pkg_re = new RegExp("^/map/([\\w0-9\\.]+)$");

router.get("/check", function(req, res) {
    res.send("Here I am.");
});

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
		if (err) { return handle_error(err, res); }
	    } else {
		res.send(JSON.stringify({ 'result': 'OK' }));
	    }
	});
    });
});

// Find the position of a single function
router.get(
    new RegExp("^/findfunction/([\\w0-9\\.]+)/(.*)$"),
    function(req, res) {
	var package = req.params[0];
	var func = req.params[1];
	var db = nano.use('code');

	res.set('Content-Type', 'application/json');
	db.get(package, function(err, body) {
	    if (err) { return handle_error(err, res); }
	    var fun = body.functions
		.filter(function(x) { return x.ID == func; });
	    fun = fun[0];
	    if (fun) {
		res.send(fun);
	    } else {
		res.set(404)
		    .send('{ "result": "error", "error": "Not found" }');
	    }
	});
    }
)

// Redirect to a function
router.get(
    new RegExp("^/redirect/([\\w0-9\\.]+)/(.*)$"),
    function(req, res) {
	var package = req.params[0];
	var func = req.params[1];
	var db = nano.use('code');

	db.get(package, function(err, body) {
	    var url;
	    url = 'https://github.com/cran/' + package;
	    if (! err) {
		var fun = body.functions
		    .filter(function(x) { return x.ID == func; });
		fun = fun[0];
		if (fun && fun.file) {
		    url = 'https://github.com/cran/' + package +
			'/blob/master/' + fun.file + '#L' + fun.line;
		}
	    }

	    res.redirect(301, url);
	});
    }
)

// Redirect to manual
router.get(
    new RegExp("^/redirectdocs/([\\w0-9\\.]+)/(.*)$"),
    function(req, res) {
	var package = req.params[0];
	var func = req.params[1];
	var db = nano.use('docs');

	db.get(package, function(err, body) {
	    var url = 'http://search.r-project.org/library/' +
		package + '/html/00Index.html';

	    if (!err) {
		var pages = Object.keys(body);
		var hits = pages.filter(function(x) {
		    return isarray(body[x]) && body[x].indexOf(func) > -1
		});
		console.log(pages);
		console.log(hits);
		if (hits.length) {
		    var html = hits[0].replace(/\.Rd$/, '.html');
		    url = url.replace(/00Index\.html$/, html);
		}
	    }

	    res.redirect(301, url);
	});
    }
)

// Get all links for a file

router.get(
    new RegExp("^/filelinks/([\\w0-9\\.]+)/(.*)$"),
    function(req, res) {
	var package = req.params[0];
	var file = req.params[1];
	var db = nano.use('code');

	res.set('Content-Type', 'application/json');

	db.get(package, function(err, body) {
	    if (err) { return handle_error(err, res); }
	    var calls = body.calls
		.filter(function(x) { return x.file == file; });
	    res.send(calls);
	});
    }
)

function handle_error(err, res) {
    res.set('Content-Type', 'application/json')
	.set(500)
	.send(JSON.stringify({ 'result': 'error', 'error': err }));
}

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
