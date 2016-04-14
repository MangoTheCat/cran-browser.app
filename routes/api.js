
var express = require('express');
var router = express.Router();

router.get(new RegExp("^/map/([\\w0-9\\.]+)$"), function(req, res) {
    var package = req.params[0];
    res.set('Content-Type', 'application/json')
	.sendfile(
	    './public/data/' + package + '.json',
	    function(err) {
		if (err) {
		    console.log(err);
		    res.status(404).end();
		}
	    }
	);
})

module.exports = router;
